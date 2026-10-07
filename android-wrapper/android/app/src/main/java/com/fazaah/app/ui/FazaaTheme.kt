package com.fazaah.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import com.fazaah.app.R

private val Navy = Color(0xFF102443)
private val NavyDark = Color(0xFF07172D)
private val Gold = Color(0xFFF5B335)
private val Page = Color(0xFFF2F4F7)
private val Arabic = FontFamily(Font(R.font.noto_sans_arabic_regular, FontWeight.Normal), Font(R.font.noto_sans_arabic_bold, FontWeight.Bold))

private val LightColors = lightColorScheme(primary = Navy, onPrimary = Color.White, secondary = Gold, onSecondary = Navy, background = Page, surface = Color.White, onBackground = Navy, onSurface = Navy, outline = Color(0xFFD9E1EA))
private val DarkColors = darkColorScheme(primary = Color(0xFF355A8F), onPrimary = Color.White, secondary = Gold, onSecondary = Navy, background = NavyDark, surface = Color(0xFF142743), onBackground = Color(0xFFF2F4F7), onSurface = Color(0xFFF2F4F7), outline = Color(0xFF30435E))

private val FazaaTypography = Typography(
    bodyLarge = TextStyle(fontFamily = Arabic, fontSize = 16.sp),
    bodyMedium = TextStyle(fontFamily = Arabic, fontSize = 14.sp),
    bodySmall = TextStyle(fontFamily = Arabic, fontSize = 12.sp),
    titleLarge = TextStyle(fontFamily = Arabic, fontWeight = FontWeight.Bold, fontSize = 22.sp),
    headlineSmall = TextStyle(fontFamily = Arabic, fontWeight = FontWeight.Bold, fontSize = 26.sp),
)

@Composable
fun FazaaTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = LightColors, typography = FazaaTypography, content = content)
}
