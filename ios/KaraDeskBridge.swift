import Foundation
import KaraDesk
import UIKit

@objc(KaraDeskBridge)
@MainActor
public final class KaraDeskBridge: NSObject {
    private static var unreadObserver: (any NSObjectProtocol)?

    @objc public static func initialize(spaceId: String, appId: String, onUnreadCountChange: @escaping (Int) -> Void) {
        KaraDesk.initialize(spaceID: spaceId, appID: appId)

        if let unreadObserver {
            NotificationCenter.default.removeObserver(unreadObserver)
        }

        unreadObserver = NotificationCenter.default.addObserver(
            forName: KaraDesk.unreadConversationCountDidChangeNotification,
            object: nil,
            queue: .main
        ) { notification in
            let count = notification.userInfo?[KaraDesk.unreadConversationCountKey] as? Int ?? 0
            onUnreadCountChange(count)
        }
    }

    @objc public static func login(
        _ user: [String: Any],
        resolve: @escaping () -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        Task { @MainActor in
            do {
                try await KaraDesk.login(makeUser(user))
                resolve()
            } catch {
                reject(code(for: error), error.localizedDescription)
            }
        }
    }

    @objc public static func updateUser(
        _ user: [String: Any],
        resolve: @escaping () -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        Task { @MainActor in
            do {
                try await KaraDesk.updateUser(makeUser(user))
                resolve()
            } catch {
                reject(code(for: error), error.localizedDescription)
            }
        }
    }

    @objc public static func logout() {
        KaraDesk.logout()
    }

    @objc public static func present(type: String, id: NSNumber?, message: String?, style: String) {
        let destination: KaraDesk.Destination

        switch type {
        case "messages":
            destination = .messages
        case "newConversation":
            destination = .newConversation(message: message)
        case "conversation":
            guard let id else { return }
            destination = .conversation(id: id.intValue)
        case "helpCenter":
            destination = .helpCenter
        case "article":
            guard let id else { return }
            destination = .article(id: id.intValue)
        default:
            destination = .home
        }

        KaraDesk.present(destination, style: style == "standalone" ? .standalone : .standard)
    }

    @objc public static func dismiss() {
        KaraDesk.dismiss()
    }

    @objc public static var isPresented: Bool {
        KaraDesk.isPresented
    }

    @objc public static var unreadConversationCount: Int {
        KaraDesk.unreadConversationCount
    }

    @objc public static func setShowsInAppMessages(_ enabled: Bool) {
        KaraDesk.showsInAppMessages = enabled
    }

    @objc public static func setOpensConversationsFromNotifications(_ enabled: Bool) {
        KaraDesk.opensConversationsFromNotifications = enabled
    }

    @objc public static func setDeviceToken(_ token: String) {
        guard let data = Data(hexString: token) else {
            return
        }

        KaraDesk.setDeviceToken(data)
    }

    @objc public nonisolated static func isKaraDeskPush(_ data: [AnyHashable: Any]) -> Bool {
        KaraDesk.isKaraDeskPush(data)
    }

    @objc public nonisolated static func handlePush(_ data: [AnyHashable: Any]) -> Bool {
        KaraDesk.handlePush(data)
    }

    @objc public nonisolated static var sdkVersion: String {
        KaraDesk.version
    }

    private static func makeUser(_ values: [String: Any]) -> KaraDesk.User {
        let signedUpAt = (values["signedUpAt"] as? NSNumber).map {
            Date(timeIntervalSince1970: $0.doubleValue / 1000)
        }

        return KaraDesk.User(
            id: values["id"] as? String,
            email: values["email"] as? String,
            name: values["name"] as? String,
            phone: values["phone"] as? String,
            avatarURL: (values["avatarUrl"] as? String).flatMap(URL.init(string:)),
            signedUpAt: signedUpAt,
            userHash: values["userHash"] as? String
        )
    }

    private static func code(for error: any Error) -> String {
        guard let error = error as? KaraDeskError else {
            return "unexpected_response"
        }

        switch error {
        case .notInitialized:
            return "not_initialized"
        case .notLoggedIn:
            return "not_logged_in"
        case .invalidConfiguration:
            return "invalid_configuration"
        case .identityVerificationFailed:
            return "identity_verification_failed"
        case .unavailable:
            return "unavailable"
        case .network:
            return "network"
        case .server:
            return "server"
        case .unexpectedResponse:
            return "unexpected_response"
        }
    }
}

private extension Data {
    init?(hexString: String) {
        let hex = hexString.trimmingCharacters(in: CharacterSet(charactersIn: "<> ")).replacingOccurrences(of: " ", with: "")

        guard hex.count.isMultiple(of: 2), !hex.isEmpty else {
            return nil
        }

        var bytes = [UInt8]()
        bytes.reserveCapacity(hex.count / 2)
        var index = hex.startIndex

        while index < hex.endIndex {
            let next = hex.index(index, offsetBy: 2)

            guard let byte = UInt8(hex[index..<next], radix: 16) else {
                return nil
            }

            bytes.append(byte)
            index = next
        }

        self.init(bytes)
    }
}
