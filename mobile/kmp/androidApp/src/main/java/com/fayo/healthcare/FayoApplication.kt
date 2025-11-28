package com.fayo.healthcare

import android.app.Application
import com.fayo.healthcare.di.appModule
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin

class FayoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        startKoin {
            androidContext(this@FayoApplication)
            modules(appModule)
        }
    }
}

