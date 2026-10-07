package com.fazaah.app.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.Shapes
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import com.fazaah.app.R

private val Navy = Color(0xFF102443)
private val NavyDark = Color(0xFF07172D)
private val Gold = Color(0xFFF5B335)
private val Page = Color(0xFFF5F7F9)
private val Arabic = FontFamily(Font(R.font.tajawal_regular, FontWeight.Normal), Font(R.font.tajawal_medium, FontWeight.Medium), Font(R.font.tajawal_bold, FontWeight.Bold), Font(R.font.tajawal_extra_bold, FontWeight.ExtraBold))

private val LightColors = lightColorScheme(primary = Navy, onPrimary = Color.White, secondary = Gold, onSecondary = Navy, background = Page, surface = Color.White, onBackground = Color(0xFF102442), onSurface = Color(0xFF102442), outline = Color(0xFFDADFE7), surfaceVariant = Color(0xFFEAEDF1))
private val DarkColors = darkColorScheme(primary = Color(0xFF355A8F), onPrimary = Color.White, secondary = Gold, onSecondary = Navy, background = Color(0xFF0E131B), surface = Color(0xFF151A23), onBackground = Color(0xFFE8EAEE), onSurface = Color(0xFFE8EAEE), outline = Color(0xFF30435E))

private val FazaaTypography = Typography(
    bodyLarge = TextStyle(fontFamily = Arabic, fontSize = 16.sp, lineHeight = 25.sp),
    bodyMedium = TextStyle(fontFamily = Arabic, fontSize = 14.sp, lineHeight = 22.sp),
    bodySmall = TextStyle(fontFamily = Arabic, fontSize = 12.sp, lineHeight = 18.sp),
    titleLarge = TextStyle(fontFamily = Arabic, fontWeight = FontWeight.Bold, fontSize = 22.sp, lineHeight = 28.sp),
    headlineSmall = TextStyle(fontFamily = Arabic, fontWeight = FontWeight.ExtraBold, fontSize = 26.sp, lineHeight = 32.sp),
)
private val FazaaShapes = Shapes(small = RoundedCornerShape(14.dp), medium = RoundedCornerShape(18.dp), large = RoundedCornerShape(24.dp))

@Composable
fun FazaaTheme(darkTheme: Boolean = false, content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (darkTheme) DarkColors else LightColors, typography = FazaaTypography, shapes = FazaaShapes, content = content)
}
