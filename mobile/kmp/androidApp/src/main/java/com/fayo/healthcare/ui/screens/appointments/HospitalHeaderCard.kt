package com.fayo.healthcare.ui.screens.appointments

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fayo.healthcare.data.models.HospitalDto
import com.fayo.healthcare.ui.theme.Gray600
import com.fayo.healthcare.ui.theme.Gray900
import com.fayo.healthcare.ui.theme.SkyBlue100
import com.fayo.healthcare.ui.theme.SkyBlue600
import com.fayo.healthcare.ui.theme.SkyBlue700

@Composable
fun HospitalHeaderCard(hospital: HospitalDto) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Hospital Icon
            Box(
                modifier = Modifier
                    .size(70.dp)
                    .background(SkyBlue100, RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.LocalHospital,
                    contentDescription = null,
                    modifier = Modifier.size(40.dp),
                    tint = SkyBlue600
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = hospital.name,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Gray900
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = hospital.type,
                    fontSize = 14.sp,
                    color = SkyBlue700,
                    fontWeight = FontWeight.Medium
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${hospital.address ?: ""}, ${hospital.city ?: ""}",
                    fontSize = 13.sp,
                    color = Gray600
                )
            }
        }
    }
}
