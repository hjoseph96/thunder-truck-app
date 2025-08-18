// Markdown content loader for Terms of Service and Privacy Policy

export const PRIVACY_POLICY_CONTENT = `# ThunderTruck Privacy Policy  

**Effective Date:** August 18, 2025  

Your privacy is important to us. This Privacy Policy explains how **ThunderTruck, Inc.** ("we," "our," or "us") collects, uses, and protects your information when you use the ThunderTruck mobile app.  

---

## 1. Information We Collect  
- **Personal Information:** Name, email, phone number, delivery address, and payment details (processed securely by third-party providers).  
- **Order Information:** Items ordered, order history, delivery instructions.  
- **Device Information:** IP address, device type, operating system, and app usage statistics.  
- **Location Information:** If you enable location services, we collect your location to show nearby food trucks and process deliveries.  

## 2. How We Use Information  
We use your information to:  
- Process and deliver food orders;  
- Communicate with you about orders, promotions, and app updates;  
- Improve app functionality and user experience;  
- Prevent fraud, abuse, or security issues;  
- Comply with legal obligations.  

## 3. Sharing of Information  
We may share your information with:  
- **Food Trucks:** To fulfill and deliver your orders;  
- **Payment Processors:** For secure transactions;  
- **Delivery Partners:** To deliver your order;  
- **Service Providers:** For hosting, analytics, and customer support;  
- **Legal Authorities:** If required by law or to protect our rights.  

We do not sell your personal information to third parties.  

## 4. Data Security  
We use encryption and industry-standard safeguards to protect your data. However, no system is 100% secure.  

## 5. Data Retention  
We retain personal data only as long as necessary to provide services and comply with legal obligations.  

## 6. Your Rights  
Depending on applicable law, you may have the right to:  
- Access, correct, or delete your personal information;  
- Opt out of marketing communications;  
- Restrict or object to certain data uses.  

To exercise your rights, contact us at team@makeshift.software.  

## 7. Children's Privacy  
ThunderTruck is not intended for children under 13. We do not knowingly collect data from children.  

## 8. Changes to This Policy  
We may update this Privacy Policy from time to time. Updates will be posted in the app with a revised effective date.  

## 9. Contact Us  
For questions about this Privacy Policy, contact us at:  
**ThunderTruck, Inc.**  
Email: team@makeshift.software  
Address: 1910 Glenwood Rd, Brooklyn, NY`;

export const TERMS_OF_SERVICE_CONTENT = `# ThunderTruck Terms of Service

**Effective Date:** August 18, 2025  

Welcome to **ThunderTruck**, a mobile app connecting customers with local food trucks in the New York City area for convenient ordering and delivery. By downloading, accessing, or using ThunderTruck, you agree to these Terms of Service ("Terms"). If you do not agree, please do not use the app.  

---

## 1. Eligibility  
- You must be at least 18 years old to use ThunderTruck.  
- By using the app, you represent and warrant that you have the legal capacity to enter into this agreement.  

## 2. Use of the Service  
- ThunderTruck allows users to browse food trucks, place orders, and request deliveries.  
- You agree not to misuse the app, interfere with its operations, or attempt to access it in unauthorized ways.  
- You are responsible for maintaining the confidentiality of your account credentials.  

## 3. Orders and Payments  
- Orders are placed directly through ThunderTruck. Once confirmed, orders are binding.  
- Prices, availability, and delivery times are set by participating food trucks and may vary.  
- Payments are processed through secure third-party payment providers. ThunderTruck does not store full payment details.  
- All sales are final unless otherwise required by law or the food truck's refund policy.  

## 4. Delivery  
- Delivery times are estimates and not guaranteed.  
- ThunderTruck and participating food trucks are not liable for delays caused by weather, traffic, or other unforeseen circumstances.  

## 5. Fees  
- ThunderTruck may charge service or delivery fees. These will be disclosed before you complete your purchase.  

## 6. Content  
- Content (menus, photos, reviews, etc.) is provided by food trucks or users. ThunderTruck does not guarantee accuracy.  
- By submitting reviews or other content, you grant ThunderTruck a non-exclusive, royalty-free license to use, display, and distribute that content.  

## 7. Prohibited Conduct  
You agree not to:  
- Use ThunderTruck for unlawful purposes;  
- Impersonate another person;  
- Attempt to hack, disrupt, or reverse engineer the app;  
- Post harmful, offensive, or fraudulent content.  

## 8. Termination  
ThunderTruck may suspend or terminate your account at any time for violations of these Terms.  

## 9. Disclaimers  
- ThunderTruck provides the app "as is" and makes no warranties regarding uninterrupted or error-free service.  
- ThunderTruck is not responsible for the quality of food or services provided by food trucks.  

## 10. Limitation of Liability  
To the maximum extent permitted by law, ThunderTruck is not liable for indirect, incidental, or consequential damages arising from your use of the app.  

## 11. Governing Law  
These Terms are governed by the laws of the State of New York, without regard to its conflict of law provisions.  

## 12. Changes to Terms  
ThunderTruck may update these Terms at any time. Continued use of the app after changes means you accept the new Terms.  

## 13. Contact Us  
If you have questions, contact us at:  
**ThunderTruck, Inc.**  
Email: team@makeshift.software  
Address: 1910 Glenwood Rd, Brooklyn, NY`;

export const getMarkdownContent = (type) => {
  switch (type) {
    case 'privacy':
      return PRIVACY_POLICY_CONTENT;
    case 'terms':
      return TERMS_OF_SERVICE_CONTENT;
    default:
      return '';
  }
};
