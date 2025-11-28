package com.fayo.healthcare.data.api

import io.ktor.client.*

// In this simplified setup we use a single JVM implementation,
// so we keep the expect here and provide the actual in jvmMain.
expect fun createHttpClient(): HttpClient

