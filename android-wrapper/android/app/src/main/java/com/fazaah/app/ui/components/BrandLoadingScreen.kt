package com.fazaah.app.ui.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fazaah.app.R

@Composable
fun BrandLoadingScreen(message: String = "جارٍ تحميل فزعة...") {
    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Image(painter = painterResource(R.drawable.fazaah_logo), contentDescription = "فزعة", modifier = Modifier.size(118.dp))
        CircularProgressIndicator(color = Color(0xFFF5B335), modifier = Modifier.size(24.dp))
        Text(message, color = Color(0xFF102443), fontSize = 13.sp)
    }
}
