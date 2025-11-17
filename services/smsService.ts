import twilio from 'twilio';
import { prisma } from '../server';

class SMSService {
  private client: any;

  constructor() {
    // Using Africa's Talking SMS API
    this.client = require('africastalking')({
      apiKey: process.env.SMS_API_KEY,
      username: process.env.SMS_USERNAME
    }).SMS;
  }

  async sendSMS(to: string, message: string, schoolId: string, messageType: string) {
    try {
      const options = {
        to: [to],
        message: message,
        from: process.env.SMS_SENDER_ID || 'TOPLINK'
      };

      const response = await this.client.send(options);
      
      // Log SMS
      await prisma.smsLog.create({
        data: {
          schoolId,
          recipientPhone: to,
          message,
          messageType,
          status: 'sent',
          cost: 0 // You might calculate this based on provider
        }
      });

      return { success: true, response };
    } catch (error) {
      console.error('SMS sending failed:', error);
      
      // Log failed SMS
      await prisma.smsLog.create({
        data: {
          schoolId,
          recipientPhone: to,
          message,
          messageType,
          status: 'failed'
        }
      });

      return { success: false, error };
    }
  }

  async sendBulkSMS(recipients: string[], message: string, schoolId: string, messageType: string) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendSMS(recipient, message, schoolId, messageType);
      results.push({ recipient, ...result });
      
      // Rate limiting - wait 100ms between sends
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

export default new SMSService();
