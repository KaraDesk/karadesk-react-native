package com.karadesk.reactnative

import android.app.Application
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.karadesk.KaraDesk
import com.karadesk.KaraDeskException
import com.karadesk.KaraDeskUser
import java.time.Instant
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

@ReactModule(name = KaraDeskModule.NAME)
class KaraDeskModule(reactContext: ReactApplicationContext) : NativeKaraDeskModuleSpec(reactContext) {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private var unreadJob: Job? = null

  override fun getName(): String = NAME

  override fun initialize(spaceId: String, appId: String) {
    UiThreadUtil.runOnUiThread {
      val application = reactApplicationContext.applicationContext as Application

      KaraDesk.initialize(application, spaceId, appId)

      unreadJob?.cancel()
      unreadJob = scope.launch {
        KaraDesk.unreadConversationCount.collect { count ->
          emitOnUnreadConversationCountChange(
            Arguments.createMap().apply { putDouble("count", count.toDouble()) },
          )
        }
      }
    }
  }

  override fun login(user: ReadableMap, promise: Promise) {
    scope.launch {
      try {
        KaraDesk.login(user.toKaraDeskUser())
        promise.resolve(null)
      } catch (error: KaraDeskException) {
        promise.reject(error.code(), error.message, error)
      } catch (error: Exception) {
        promise.reject("unexpected_response", error.message, error)
      }
    }
  }

  override fun updateUser(user: ReadableMap, promise: Promise) {
    scope.launch {
      try {
        KaraDesk.updateUser(user.toKaraDeskUser())
        promise.resolve(null)
      } catch (error: KaraDeskException) {
        promise.reject(error.code(), error.message, error)
      } catch (error: Exception) {
        promise.reject("unexpected_response", error.message, error)
      }
    }
  }

  override fun logout() {
    UiThreadUtil.runOnUiThread { KaraDesk.logout() }
  }

  override fun present(destination: ReadableMap, style: String) {
    val target = destination.toDestination() ?: return
    val presentation =
      if (style == "standalone") KaraDesk.PresentationStyle.STANDALONE else KaraDesk.PresentationStyle.STANDARD

    UiThreadUtil.runOnUiThread {
      KaraDesk.present(reactApplicationContext.currentActivity ?: reactApplicationContext, target, presentation)
    }
  }

  override fun dismiss() {
    UiThreadUtil.runOnUiThread { KaraDesk.dismiss() }
  }

  override fun isPresented(promise: Promise) {
    UiThreadUtil.runOnUiThread { promise.resolve(KaraDesk.isPresented) }
  }

  override fun getUnreadConversationCount(promise: Promise) {
    promise.resolve(KaraDesk.unreadConversationCount.value.toDouble())
  }

  override fun setShowsInAppMessages(enabled: Boolean) {
    KaraDesk.showsInAppMessages = enabled
  }

  override fun setOpensConversationsFromNotifications(enabled: Boolean) {
    KaraDesk.opensConversationsFromNotifications = enabled
  }

  override fun trackEvent(name: String, metadata: ReadableMap) {
    KaraDesk.trackEvent(name, metadata.toHashMap())
  }

  override fun setDeviceToken(token: String) {
    KaraDesk.setDeviceToken(token)
  }

  override fun isKaraDeskPush(data: ReadableMap): Boolean = KaraDesk.isKaraDeskPush(data.toStringMap())

  override fun handlePush(data: ReadableMap, promise: Promise) {
    val values = data.toStringMap()

    UiThreadUtil.runOnUiThread {
      promise.resolve(KaraDesk.handlePush(reactApplicationContext, values))
    }
  }

  override fun getVersion(): String = KaraDesk.version

  override fun invalidate() {
    scope.cancel()
    super.invalidate()
  }

  private fun ReadableMap.string(key: String): String? = if (hasKey(key) && !isNull(key)) getString(key) else null

  private fun ReadableMap.toKaraDeskUser(): KaraDeskUser {
    val signedUpAt = if (hasKey("signedUpAt") && !isNull("signedUpAt")) {
      Instant.ofEpochMilli(getDouble("signedUpAt").toLong())
    } else {
      null
    }

    return KaraDeskUser(
      id = string("id"),
      email = string("email"),
      name = string("name"),
      phone = string("phone"),
      avatarUrl = string("avatarUrl"),
      signedUpAt = signedUpAt,
      userHash = string("userHash"),
    )
  }

  private fun ReadableMap.toDestination(): KaraDesk.Destination? {
    val id = if (hasKey("id") && !isNull("id")) getDouble("id").toLong() else null

    return when (string("type")) {
      "messages" -> KaraDesk.Destination.Messages
      "newConversation" -> KaraDesk.Destination.NewConversation(string("message"))
      "conversation" -> id?.let { KaraDesk.Destination.Conversation(it) }
      "helpCenter" -> KaraDesk.Destination.HelpCenter
      "article" -> id?.let { KaraDesk.Destination.Article(it) }
      else -> KaraDesk.Destination.Home
    }
  }

  private fun ReadableMap.toStringMap(): Map<String, String> =
    toHashMap().mapNotNull { (key, value) -> value?.let { key to it.toString() } }.toMap()

  private fun KaraDeskException.code(): String = when (this) {
    is KaraDeskException.NotInitialized -> "not_initialized"
    is KaraDeskException.NotLoggedIn -> "not_logged_in"
    is KaraDeskException.InvalidConfiguration -> "invalid_configuration"
    is KaraDeskException.IdentityVerificationFailed -> "identity_verification_failed"
    is KaraDeskException.Unavailable -> "unavailable"
    is KaraDeskException.Network -> "network"
    is KaraDeskException.Server -> "server"
    is KaraDeskException.UnexpectedResponse -> "unexpected_response"
  }

  companion object {
    const val NAME = "KaraDeskModule"
  }
}
