# Agora Usage Monitoring Guide

This guide helps you monitor Agora usage, set up alerts, and understand when to upgrade.

## 📊 Monitoring Usage in Agora Console

### Accessing the Dashboard

1. **Login to Agora Console**
   - URL: https://console.agora.io/
   - Use your Agora account credentials

2. **Navigate to Usage & Billing**
   - Go to: **Projects** → Select your project → **Usage & Billing**
   - View real-time and historical usage data

### Key Metrics to Monitor

#### 1. **Monthly Minutes Usage**
- **Video Calling Minutes**: Track total video call minutes
- **Voice Calling Minutes**: Track total voice call minutes
- **Free Tier**: 10,000 minutes/month for each
- **Location**: Dashboard → Usage Statistics

#### 2. **Daily Usage Trends**
- View daily breakdown of minutes used
- Identify peak usage days
- Plan for scaling

#### 3. **Concurrent Users**
- Maximum simultaneous users in channels
- Helps understand capacity needs

#### 4. **Peak Concurrent Channels**
- Number of active channels at peak times
- Important for infrastructure planning

## 🔔 Setting Up Usage Alerts

### Step 1: Configure Alerts in Console

1. Go to **Projects** → Your Project → **Settings** → **Alerts**
2. Click **Create Alert**
3. Configure:
   - **Alert Type**: Usage threshold
   - **Threshold**: Set at 80% of free tier (8,000 minutes)
   - **Notification**: Email/SMS
   - **Frequency**: Daily/Weekly

### Step 2: Alert Thresholds Recommended

```
⚠️ Warning Alert: 8,000 minutes (80% of free tier)
🚨 Critical Alert: 9,500 minutes (95% of free tier)
```

### Step 3: Set Up Multiple Alerts

- **Daily Usage Alert**: If daily usage > 500 minutes
- **Weekly Usage Alert**: If weekly usage > 2,500 minutes
- **Monthly Usage Alert**: If monthly usage > 8,000 minutes

## 📈 Usage Estimation Calculator

### Formula
```
Monthly Minutes = (Average Call Duration × Calls per Day × Days per Month × Participants per Call)
```

### Example Calculations

#### Scenario 1: Small Clinic
- **Calls per day**: 20
- **Average duration**: 10 minutes
- **Participants**: 2 (admin + patient)
- **Days per month**: 30

**Calculation:**
```
20 calls × 10 min × 30 days × 2 participants = 12,000 minutes/month
Free tier: 10,000 minutes
Overage: 2,000 minutes
Cost: 2,000 × $3.99/1,000 = $7.98/month
```

#### Scenario 2: Medium Hospital
- **Calls per day**: 100
- **Average duration**: 15 minutes
- **Participants**: 2
- **Days per month**: 30

**Calculation:**
```
100 calls × 15 min × 30 days × 2 participants = 90,000 minutes/month
Free tier: 10,000 minutes
Overage: 80,000 minutes
Cost: 80,000 × $3.99/1,000 = $319.20/month
```

#### Scenario 3: Large Network
- **Calls per day**: 500
- **Average duration**: 20 minutes
- **Participants**: 2
- **Days per month**: 30

**Calculation:**
```
500 calls × 20 min × 30 days × 2 participants = 600,000 minutes/month
Free tier: 10,000 minutes
Overage: 590,000 minutes
Cost: 590,000 × $3.99/1,000 = $2,354.10/month
```

## 💰 Cost Optimization Strategies

### 1. **Use Voice Calls When Video Isn't Needed**
- Voice: $0.99 per 1,000 minutes
- Video: $3.99 per 1,000 minutes
- **Savings**: 75% cost reduction for voice-only calls

### 2. **Optimize Call Duration**
- Set maximum call duration limits
- Auto-end calls after inactivity
- Implement efficient scheduling

### 3. **Monitor and Optimize**
- Track which calls are longest
- Identify unnecessary calls
- Implement call quality checks

### 4. **Use Volume Discounts**
- Agora automatically applies discounts at scale
- Higher usage = lower per-minute cost

## 📱 Application-Level Monitoring

### Track Usage in Your Application

Add usage tracking to your call service:

```typescript
// services/call-service/src/calls/calls.service.ts

async issueToken(sessionId: string, userId: string, role: CallParticipantRole) {
  // ... existing code ...
  
  // Track call start
  await this.trackCallStart(session);
  
  return { message: 'Token issued', session, credential };
}

async updateStatus(sessionId: string, userId: string, status: CallStatus) {
  // ... existing code ...
  
  if (status === CallStatus.ACTIVE) {
    await this.trackCallActive(session);
  }
  
  if (status === CallStatus.COMPLETED || status === CallStatus.CANCELLED) {
    await this.trackCallEnd(session);
  }
  
  // ... existing code ...
}

private async trackCallStart(session: CallSession) {
  // Log call start for monitoring
  this.logger.log(`Call started: ${session.id}, Type: ${session.callType}`);
}

private async trackCallEnd(session: CallSession) {
  if (session.startedAt && session.endedAt) {
    const duration = Math.floor(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 1000 / 60
    );
    this.logger.log(`Call ended: ${session.id}, Duration: ${duration} minutes`);
    
    // Store usage metrics in database for reporting
    // You can create a CallUsage table to track this
  }
}
```

## 📊 Create Usage Dashboard (Optional)

### Database Schema for Usage Tracking

```prisma
model CallUsage {
  id          String   @id @default(cuid())
  sessionId  String
  callType   String   // VIDEO or VOICE
  duration   Int      // Duration in minutes
  participants Int    // Number of participants
  totalMinutes Int    // duration * participants
  createdAt  DateTime @default(now())
  
  @@index([createdAt])
  @@map("call_usage")
}
```

### Usage Report Endpoint

```typescript
// services/call-service/src/calls/calls.controller.ts

@Get('usage')
@UseGuards(JwtAuthGuard)
async getUsage(
  @Request() req,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
) {
  return this.callsService.getUsageStats(
    req.user.id,
    startDate ? new Date(startDate) : undefined,
    endDate ? new Date(endDate) : undefined,
  );
}
```

## 🚀 When to Upgrade

### Upgrade Considerations

1. **Exceeding Free Tier Regularly**
   - If you consistently use > 10,000 minutes/month
   - Consider paid plan for better rates

2. **Need Premium Features**
   - Cloud recording
   - Advanced analytics
   - Content moderation
   - Higher quality streams

3. **Enterprise Requirements**
   - SLA guarantees
   - Dedicated support
   - Custom integrations

## 📞 Contact Agora Sales

If you need:
- Custom pricing for high volume
- Enterprise features
- Dedicated support
- Special requirements

**Contact**: sales@agora.io or through console

## 🔍 Regular Monitoring Checklist

- [ ] Check daily usage in console (weekly)
- [ ] Review monthly usage trends (monthly)
- [ ] Verify alert configurations (monthly)
- [ ] Analyze cost vs. budget (monthly)
- [ ] Review call quality metrics (weekly)
- [ ] Optimize based on usage patterns (ongoing)

## 📝 Usage Log Template

Keep a simple log:

```
Date: 2025-11-17
Video Minutes Used: 1,234
Voice Minutes Used: 567
Total: 1,801
Remaining Free: 8,199
Projected Monthly: ~54,000 (will exceed free tier)
Estimated Cost: ~$175/month
```

## 🎯 Best Practices

1. **Monitor Weekly**: Don't wait until end of month
2. **Set Alerts Early**: At 80% of free tier
3. **Track Trends**: Identify growth patterns
4. **Optimize Continuously**: Reduce unnecessary usage
5. **Plan Ahead**: Forecast based on growth

---

**Next Steps:**
1. Set up console alerts
2. Monitor for 1-2 weeks
3. Calculate projected monthly usage
4. Decide on upgrade if needed

