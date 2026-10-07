import 'package:flutter/material.dart';

abstract final class FazaaColors {
  static const navy = Color(0xFF17344A);
  static const deepNavy = Color(0xFF102838);
  static const gold = Color(0xFFD9A441);
  static const canvas = Color(0xFFF6F5F1);
  static const ink = Color(0xFF1F2D36);
  static const muted = Color(0xFF66757E);
  static const border = Color(0xFFE4E7E8);
}

abstract final class FazaaTheme {
  static ThemeData get light {
    final colorScheme =
        ColorScheme.fromSeed(
          seedColor: FazaaColors.navy,
          brightness: Brightness.light,
        ).copyWith(
          primary: FazaaColors.navy,
          secondary: FazaaColors.gold,
          surface: Colors.white,
        );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: FazaaColors.canvas,
      appBarTheme: const AppBarTheme(
        backgroundColor: FazaaColors.canvas,
        foregroundColor: FazaaColors.ink,
        elevation: 0,
        centerTitle: false,
      ),
      textTheme: const TextTheme(
        headlineMedium: TextStyle(
          color: FazaaColors.ink,
          fontSize: 30,
          fontWeight: FontWeight.w800,
          height: 1.25,
        ),
        titleLarge: TextStyle(
          color: FazaaColors.ink,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
        bodyLarge: TextStyle(
          color: FazaaColors.muted,
          fontSize: 16,
          height: 1.7,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: FazaaColors.navy,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: FazaaColors.navy,
          minimumSize: const Size.fromHeight(56),
          side: const BorderSide(color: FazaaColors.border),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        ),
      ),
    );
  }
}
