#!/usr/bin/env python3
"""Generate the checked-in Xcode project, scheme, app icon and launch colour.

    python3 ios/generate_project.py

The iPhones LA app's generator (iphoneslainv ios/generate_project.py), cut down
for WeBuy.AD: no Swift packages. Source files are hand-maintained; run this
again after adding a Swift source. The icon is the brand kit's
(assets/brand/icon-1024.png, drawn by tools/brand/make.sh), flattened, since
the App Store refuses an icon with an alpha channel.
"""
import hashlib
import json
import subprocess
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
APP = "WeBuyAD"


def ident(name):
    return hashlib.sha256(("webuyad-" + name).encode()).hexdigest()[:24].upper()


def generate():
    objects = []

    def add(name, body):
        objects.append(f"\t\t{ident(name)} = {{ {body} }};")
        return ident(name)

    def refs(*names):
        return "(" + ", ".join(ident(n) for n in names) + ",)"

    swift = sorted(p.name for p in (HERE / APP).glob("*.swift"))
    for name in swift:
        add(name, f'isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = "{name}"; sourceTree = "<group>";')
        add("build-" + name, f"isa = PBXBuildFile; fileRef = {ident(name)};")
    add("assets", 'isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Assets.xcassets; sourceTree = "<group>";')
    add("build-assets", f"isa = PBXBuildFile; fileRef = {ident('assets')};")
    add("privacy", 'isa = PBXFileReference; lastKnownFileType = text.xml; path = PrivacyInfo.xcprivacy; sourceTree = "<group>";')
    add("build-privacy", f"isa = PBXBuildFile; fileRef = {ident('privacy')};")
    add("config", 'isa = PBXFileReference; lastKnownFileType = text.xcconfig; path = Config/Release.xcconfig; sourceTree = "<group>";')
    add("app", f'isa = PBXFileReference; explicitFileType = wrapper.application; path = {APP}.app; sourceTree = BUILT_PRODUCTS_DIR;')
    add("source-group", f'isa = PBXGroup; path = {APP}; sourceTree = "<group>"; children = {refs(*swift, "assets", "privacy")};')
    add("products", f'isa = PBXGroup; name = Products; sourceTree = "<group>"; children = {refs("app")};')
    add("root-group", f'isa = PBXGroup; sourceTree = "<group>"; children = {refs("source-group", "config", "products")};')
    add("sources", f"isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = {refs(*('build-' + s for s in swift))}; runOnlyForDeploymentPostprocessing = 0;")
    add("frameworks", "isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0;")
    add("resources", f"isa = PBXResourcesBuildPhase; buildActionMask = 2147483647; files = {refs('build-assets', 'build-privacy')}; runOnlyForDeploymentPostprocessing = 0;")
    for scope in ("project", "target"):
        for config in ("Debug", "Release"):
            if scope == "project":
                settings = 'CLANG_ENABLE_MODULES = YES; SDKROOT = iphoneos; SUPPORTED_PLATFORMS = "iphoneos iphonesimulator";'
                if config == "Debug":
                    settings += " ONLY_ACTIVE_ARCH = YES; SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;"
                base = ""
            else:
                optimization = "-Onone" if config == "Debug" else "-O"
                settings = f'SWIFT_OPTIMIZATION_LEVEL = "{optimization}"; LD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks";'
                base = f'baseConfigurationReference = {ident("config")};'
            add(f"{scope}-{config}", f'isa = XCBuildConfiguration; {base} buildSettings = {{ {settings} }}; name = {config};')
        add(scope + "-configs", f"isa = XCConfigurationList; buildConfigurations = {refs(scope + '-Debug', scope + '-Release')}; defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;")
    add("target", f'isa = PBXNativeTarget; buildConfigurationList = {ident("target-configs")}; buildPhases = {refs("sources", "frameworks", "resources")}; buildRules = (); dependencies = (); name = {APP}; productName = {APP}; productReference = {ident("app")}; productType = "com.apple.product-type.application";')
    add("project", f'isa = PBXProject; attributes = {{ LastUpgradeCheck = 1600; }}; buildConfigurationList = {ident("project-configs")}; compatibilityVersion = "Xcode 14.0"; developmentRegion = en; knownRegions = (en, Base); mainGroup = {ident("root-group")}; productRefGroup = {ident("products")}; projectDirPath = ""; projectRoot = ""; targets = {refs("target")};')
    project = HERE / f"{APP}.xcodeproj"
    project.mkdir(exist_ok=True)
    (project / "project.pbxproj").write_text(
        "// !$*UTF8*$!\n{\n\tarchiveVersion = 1;\n\tclasses = {};\n\tobjectVersion = 56;\n\tobjects = {\n" +
        "\n".join(objects) + f"\n\t}};\n\trootObject = {ident('project')};\n}}\n"
    )
    schemes = project / "xcshareddata" / "xcschemes"
    schemes.mkdir(parents=True, exist_ok=True)
    build_ref = f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{ident("target")}" BuildableName="{APP}.app" BlueprintName="{APP}" ReferencedContainer="container:{APP}.xcodeproj"/>'
    (schemes / f"{APP}.xcscheme").write_text(f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1600" version="1.3">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries>
    <BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{build_ref}</BuildActionEntry>
  </BuildActionEntries></BuildAction>
  <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" allowLocationSimulation="YES">
    <BuildableProductRunnable runnableDebuggingMode="0">{build_ref}</BuildableProductRunnable>
  </LaunchAction>
  <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES">
    <BuildableProductRunnable runnableDebuggingMode="0">{build_ref}</BuildableProductRunnable>
  </ProfileAction>
  <AnalyzeAction buildConfiguration="Debug"/>
  <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
''')
    assets = HERE / APP / "Assets.xcassets"
    icon = assets / "AppIcon.appiconset"
    icon.mkdir(parents=True, exist_ok=True)
    (assets / "Contents.json").write_text(json.dumps({"info": {"version": 1, "author": "xcode"}}, indent=2) + "\n")
    (icon / "Contents.json").write_text(json.dumps({
        "images": [{"filename": "AppIcon.png", "idiom": "universal", "platform": "ios", "size": "1024x1024"}],
        "info": {"version": 1, "author": "xcode"},
    }, indent=2) + "\n")
    # The launch screen's colour: the site's own ground (DESIGN-LAW 152),
    # #F2F4F8 light and #070D1C dark, so the app opens with no white flash.
    launch = assets / "LaunchBackground.colorset"
    launch.mkdir(parents=True, exist_ok=True)

    def srgb(hex_rgb):
        r, g, b = (hex_rgb[i:i + 2] for i in (0, 2, 4))
        return {"color-space": "srgb", "components": {"red": f"0x{r}", "green": f"0x{g}", "blue": f"0x{b}", "alpha": "1.000"}}

    (launch / "Contents.json").write_text(json.dumps({
        "colors": [
            {"idiom": "universal", "color": srgb("F2F4F8")},
            {"idiom": "universal", "color": srgb("070D1C"), "appearances": [{"appearance": "luminosity", "value": "dark"}]},
        ],
        "info": {"version": 1, "author": "xcode"},
    }, indent=2) + "\n")
    # The brand kit's icon, through JPEG and back, which drops the alpha channel.
    with tempfile.TemporaryDirectory() as tmp:
        flat = Path(tmp) / "icon.jpg"
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "100",
                        str(ROOT / "assets/brand/icon-1024.png"), "--out", str(flat)], check=True, capture_output=True)
        subprocess.run(["sips", "-s", "format", "png", str(flat), "--out", str(icon / "AppIcon.png")],
                       check=True, capture_output=True)


if __name__ == "__main__":
    generate()
    print("wrote", HERE / f"{APP}.xcodeproj", "and its icon")
