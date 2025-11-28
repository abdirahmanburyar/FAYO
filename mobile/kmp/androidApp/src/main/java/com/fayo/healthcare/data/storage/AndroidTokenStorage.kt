package com.fayo.healthcare.data.storage

import android.content.Context
import android.content.SharedPreferences
import com.fayo.healthcare.data.api.TokenStorage

class AndroidTokenStorage(
    private val context: Context
) : TokenStorage {
    
    private val prefs: SharedPreferences by lazy {
        context.getSharedPreferences("auth_prefs", Context.MODE_PRIVATE)
    }
    
    override fun getToken(): String? {
        return prefs.getString("auth_token", null)
    }
    
    override fun saveToken(token: String) {
        prefs.edit().putString("auth_token", token).apply()
    }
    
    fun saveUserName(firstName: String?, lastName: String?) {
        prefs.edit().apply {
            if (firstName != null) {
                putString("user_first_name", firstName)
            }
            if (lastName != null) {
                putString("user_last_name", lastName)
            }
            apply()
        }
    }
    
    fun getUserName(): String? {
        val firstName = prefs.getString("user_first_name", null)
        val lastName = prefs.getString("user_last_name", null)
        return when {
            !firstName.isNullOrBlank() && !lastName.isNullOrBlank() -> "$firstName $lastName"
            !firstName.isNullOrBlank() -> firstName
            !lastName.isNullOrBlank() -> lastName
            else -> null
        }
    }
    
    fun saveUserId(userId: String) {
        prefs.edit().putString("user_id", userId).apply()
    }
    
    fun getUserId(): String? {
        return prefs.getString("user_id", null)
    }
    
    fun savePhoneNumber(phone: String) {
        prefs.edit().putString("user_phone", phone).apply()
    }
    
    fun getPhoneNumber(): String? {
        return prefs.getString("user_phone", null)
    }
    
    override fun clearToken() {
        prefs.edit().remove("auth_token").apply()
        prefs.edit().remove("user_first_name").apply()
        prefs.edit().remove("user_last_name").apply()
        prefs.edit().remove("user_id").apply()
        prefs.edit().remove("user_phone").apply()
    }
}

