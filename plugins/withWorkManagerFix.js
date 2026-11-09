const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to prevent Android WorkDatabase startup crash in release builds.
 *
 * Root cause:
 * AndroidX WorkManager (pulled in by native libraries like react-native-maps)
 * automatically registers WorkManagerInitializer via androidx.startup.InitializationProvider.
 * In release builds, R8 code shrinking strips/obfuscates Room and WorkDatabase classes,
 * causing:
 *   java.lang.RuntimeException: Failed to create an instance of class androidx.work.impl.WorkDatabase.canonicalName
 *
 * Solution:
 * Add ProGuard keep rules preserving RoomDatabase, Initializer, and WorkDatabase
 * classes and their default <init>() constructors from being stripped by R8.
 */
function withWorkManagerFix(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const proguardFile = path.join(
        modConfig.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );

      if (fs.existsSync(proguardFile)) {
        const contents = fs.readFileSync(proguardFile, 'utf8');
        const rules = [
          '',
          '# WorkManager & Room rules (fixes WorkDatabase startup crash)',
          '-keep class androidx.work.impl.WorkDatabase { *; }',
          '-keep class androidx.work.impl.WorkDatabase_Impl { *; }',
          '-keep class * extends androidx.room.RoomDatabase {',
          '    <init>();',
          '    *;',
          '}',
          '-keepclassmembers class * extends androidx.room.RoomDatabase {',
          '    <init>();',
          '    *;',
          '}',
          '-keep class androidx.work.** { *; }',
          '-keepclassmembers class androidx.work.** { *; }',
          '-keep class * extends androidx.startup.Initializer {',
          '    <init>();',
          '    *;',
          '}',
          '-dontwarn androidx.work.**',
          '',
        ].join('\n');

        if (!contents.includes('androidx.work.impl.WorkDatabase_Impl')) {
          fs.writeFileSync(proguardFile, contents + '\n' + rules, 'utf8');
        }
      }
      return modConfig;
    },
  ]);
}

module.exports = withWorkManagerFix;
