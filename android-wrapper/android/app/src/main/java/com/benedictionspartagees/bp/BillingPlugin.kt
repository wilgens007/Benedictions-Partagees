package com.benedictionspartagees.bp

import android.util.Log
import com.android.billingclient.api.*
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "BillingPlugin")
class BillingPlugin : Plugin() {

    private var billingClient: BillingClient? = null
    private var pendingPurchaseCall: PluginCall? = null

    companion object {
        private const val TAG = "BillingPlugin"
    }

    override fun load() {
        billingClient = BillingClient.newBuilder(context)
            .setListener(purchasesUpdatedListener)
            .enablePendingPurchases()
            .build()
    }

    private val purchasesUpdatedListener = PurchasesUpdatedListener { billingResult, purchases ->
        val call = pendingPurchaseCall
        pendingPurchaseCall = null

        if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
                    val result = JSObject()
                    result.put("purchaseToken", purchase.purchaseToken)
                    result.put("orderId", purchase.orderId)
                    result.put("productId", purchase.products.firstOrNull() ?: "")
                    result.put("purchaseState", purchase.purchaseState)
                    call?.resolve(result)

                    acknowledgePurchase(purchase)
                    return
                } else if (purchase.purchaseState == Purchase.PurchaseState.PENDING) {
                    val result = JSObject()
                    result.put("pending", true)
                    result.put("message", "Purchase is pending")
                    call?.resolve(result)
                    return
                }
            }
            call?.reject("No valid purchase found")
        } else if (billingResult.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
            call?.reject("Purchase cancelled by user")
        } else {
            call?.reject("Purchase failed: ${billingResult.debugMessage}")
        }
    }

    private fun acknowledgePurchase(purchase: Purchase) {
        if (!purchase.isAcknowledged) {
            val params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.purchaseToken)
                .build()
            billingClient?.acknowledgePurchase(params) { billingResult ->
                if (billingResult.responseCode == BillingClient.BillingResponseCode.OK) {
                    Log.d(TAG, "Purchase acknowledged successfully")
                } else {
                    Log.e(TAG, "Failed to acknowledge purchase: ${billingResult.debugMessage}")
                }
            }
        }
    }

    @PluginMethod
    fun purchase(call: PluginCall) {
        val productId = call.getString("productId")
        if (productId.isNullOrEmpty()) {
            call.reject("productId is required")
            return
        }

        ensureConnected { connected ->
            if (!connected) {
                call.reject("Failed to connect to Google Play Billing")
                return@ensureConnected
            }

            val productList = listOf(
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId)
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            )

            val params = QueryProductDetailsParams.newBuilder()
                .setProductList(productList)
                .build()

            billingClient?.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
                if (billingResult.responseCode != BillingClient.BillingResponseCode.OK || productDetailsList.isEmpty()) {
                    call.reject("Product not found: $productId")
                    return@queryProductDetailsAsync
                }

                val productDetails = productDetailsList[0]
                val offerToken = productDetails.subscriptionOfferDetails?.firstOrNull()?.offerToken

                if (offerToken == null) {
                    call.reject("No subscription offer available")
                    return@queryProductDetailsAsync
                }

                val flowParams = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(
                        listOf(
                            BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(productDetails)
                                .setOfferToken(offerToken)
                                .build()
                        )
                    )
                    .build()

                pendingPurchaseCall = call
                val result = billingClient?.launchBillingFlow(activity, flowParams)
                if (result?.responseCode != BillingClient.BillingResponseCode.OK) {
                    pendingPurchaseCall = null
                    call.reject("Failed to launch billing flow: ${result?.debugMessage}")
                }
            }
        }
    }

    @PluginMethod
    fun getProducts(call: PluginCall) {
        val productIds = call.getArray("productIds")
        if (productIds == null || productIds.length() == 0) {
            call.reject("productIds array is required")
            return
        }

        ensureConnected { connected ->
            if (!connected) {
                call.reject("Failed to connect to Google Play Billing")
                return@ensureConnected
            }

            val products = mutableListOf<QueryProductDetailsParams.Product>()
            for (i in 0 until productIds.length()) {
                products.add(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productIds.getString(i))
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build()
                )
            }

            val params = QueryProductDetailsParams.newBuilder()
                .setProductList(products)
                .build()

            billingClient?.queryProductDetailsAsync(params) { billingResult, productDetailsList ->
                if (billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
                    call.reject("Failed to query products: ${billingResult.debugMessage}")
                    return@queryProductDetailsAsync
                }

                val result = JSObject()
                val productsArray = org.json.JSONArray()
                for (details in productDetailsList) {
                    val item = JSObject()
                    item.put("productId", details.productId)
                    item.put("name", details.name)
                    item.put("description", details.description)

                    val offer = details.subscriptionOfferDetails?.firstOrNull()
                    if (offer != null) {
                        val pricingPhase = offer.pricingPhases.pricingPhaseList.firstOrNull()
                        item.put("price", pricingPhase?.formattedPrice ?: "")
                        item.put("priceMicros", pricingPhase?.priceAmountMicros ?: 0)
                        item.put("billingPeriod", pricingPhase?.billingPeriod ?: "")
                    }

                    productsArray.put(item)
                }
                result.put("products", productsArray)
                call.resolve(result)
            }
        }
    }

    private fun ensureConnected(callback: (Boolean) -> Unit) {
        if (billingClient?.isReady == true) {
            callback(true)
            return
        }

        billingClient?.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(billingResult: BillingResult) {
                callback(billingResult.responseCode == BillingClient.BillingResponseCode.OK)
            }

            override fun onBillingServiceDisconnected() {
                Log.w(TAG, "Billing service disconnected")
            }
        })
    }
}
