#import "KaraDeskModule.h"

#if __has_include(<KaraDeskReactNative/KaraDeskReactNative-Swift.h>)
#import <KaraDeskReactNative/KaraDeskReactNative-Swift.h>
#else
#import "KaraDeskReactNative-Swift.h"
#endif

using namespace JS::NativeKaraDeskModule;

static NSDictionary *KDUserDictionary(NativeUser &user)
{
  NSMutableDictionary *values = [NSMutableDictionary dictionary];

  if (user.id_()) {
    values[@"id"] = user.id_();
  }
  if (user.email()) {
    values[@"email"] = user.email();
  }
  if (user.name()) {
    values[@"name"] = user.name();
  }
  if (user.phone()) {
    values[@"phone"] = user.phone();
  }
  if (user.avatarUrl()) {
    values[@"avatarUrl"] = user.avatarUrl();
  }
  if (user.signedUpAt().has_value()) {
    values[@"signedUpAt"] = @(user.signedUpAt().value());
  }
  if (user.userHash()) {
    values[@"userHash"] = user.userHash();
  }

  return values;
}

@implementation KaraDeskModule

+ (NSString *)moduleName
{
  return @"KaraDeskModule";
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)initialize:(NSString *)spaceId appId:(NSString *)appId
{
  __weak KaraDeskModule *weakSelf = self;

  [KaraDeskBridge initializeWithSpaceId:spaceId
                                  appId:appId
                    onUnreadCountChange:^(NSInteger count) {
                      [weakSelf emitOnUnreadConversationCountChange:@{@"count" : @(count)}];
                    }];
}

- (void)login:(NativeUser &)user resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [KaraDeskBridge login:KDUserDictionary(user)
                resolve:^{
                  resolve(nil);
                }
                 reject:^(NSString *code, NSString *message) {
                   reject(code, message, nil);
                 }];
}

- (void)updateUser:(NativeUser &)user resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  [KaraDeskBridge updateUser:KDUserDictionary(user)
                     resolve:^{
                       resolve(nil);
                     }
                      reject:^(NSString *code, NSString *message) {
                        reject(code, message, nil);
                      }];
}

- (void)logout
{
  [KaraDeskBridge logout];
}

- (void)present:(NativeDestination &)destination style:(NSString *)style
{
  NSNumber *identifier = destination.id_().has_value() ? @(destination.id_().value()) : nil;

  [KaraDeskBridge presentWithType:destination.type()
                               id:identifier
                          message:destination.message()
                            style:style];
}

- (void)dismiss
{
  [KaraDeskBridge dismiss];
}

- (void)isPresented:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  resolve(@(KaraDeskBridge.isPresented));
}

- (void)getUnreadConversationCount:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  resolve(@(KaraDeskBridge.unreadConversationCount));
}

- (void)setShowsInAppMessages:(BOOL)enabled
{
  [KaraDeskBridge setShowsInAppMessages:enabled];
}

- (void)setOpensConversationsFromNotifications:(BOOL)enabled
{
  [KaraDeskBridge setOpensConversationsFromNotifications:enabled];
}

- (void)setDeviceToken:(NSString *)token
{
  [KaraDeskBridge setDeviceToken:token];
}

- (NSNumber *)isKaraDeskPush:(NSDictionary *)data
{
  return @([KaraDeskBridge isKaraDeskPush:data]);
}

- (void)handlePush:(NSDictionary *)data resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  resolve(@([KaraDeskBridge handlePush:data]));
}

- (void)trackEvent:(NSString *)name metadata:(NSDictionary *)metadata
{
  [KaraDeskBridge trackEvent:name metadata:metadata];
}

- (NSString *)getVersion
{
  return KaraDeskBridge.sdkVersion;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeKaraDeskModuleSpecJSI>(params);
}

@end
