require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
karadesk_ios_version = "1.1.1"

Pod::Spec.new do |s|
  s.name         = "KaraDeskReactNative"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "17.0" }
  s.source       = { :git => "https://github.com/KaraDesk/karadesk-react-native.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/**/*.h"
  s.swift_version = "6.0"
  s.pod_target_xcconfig = { "DEFINES_MODULE" => "YES" }

  spm_dependency(s,
    url: "https://github.com/KaraDesk/karadesk-ios",
    requirement: { kind: "upToNextMajorVersion", minimumVersion: karadesk_ios_version },
    products: ["KaraDesk"]
  )

  install_modules_dependencies(s)
end
