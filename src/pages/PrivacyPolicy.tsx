const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#333]" style={{ lineHeight: 1.7 }}>
      <div className="bg-gradient-to-br from-[#227845] to-[#1a5c36] text-white py-12 px-6 text-center">
        <h1 className="text-[28px] font-bold mb-2">Privacy Policy</h1>
        <p className="opacity-85 text-sm">My Dhikr — Islamic Worship Tracker</p>
      </div>

      <div className="max-w-[720px] mx-auto px-6 pt-10 pb-20 text-[15px]">
        <p className="mb-4">
          ZPresso LLC ("we", "our", or "us") operates the My Dhikr mobile application and web application (the "Service"). This Privacy Policy explains how we collect, use, and protect your information when you use our Service.
        </p>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">Information We Collect</h2>
        <p className="mb-4">When you create an account and use My Dhikr, we collect the following information:</p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Account Information:</strong> Your email address, display name, and password (stored securely and encrypted).</li>
          <li><strong>Worship Data:</strong> Dhikr counts, Quran reading progress, Salah records, daily reflections, and notes that you voluntarily enter into the app.</li>
          <li><strong>Usage Data:</strong> Basic app usage information such as login timestamps and device type to help us improve the Service.</li>
        </ul>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">How We Use Your Information</h2>
        <p className="mb-4">We use the information we collect to:</p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Provide and maintain the My Dhikr service</li>
          <li>Sync your worship data across your devices</li>
          <li>Authenticate your account and keep it secure</li>
          <li>Improve and optimize the app experience</li>
        </ul>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">Data Storage and Security</h2>
        <p className="mb-4">
          Your data is stored securely using a trusted cloud database platform with industry-standard encryption. We use HTTPS for all data transmission and your password is hashed and never stored in plain text. We take reasonable measures to protect your personal information from unauthorized access, alteration, or destruction.
        </p>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">Data Sharing</h2>
        <p className="mb-4">
          We do not sell, trade, or rent your personal information to third parties. We do not share your worship data with anyone. Your spiritual journey is private and stays between you and Allah.
        </p>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">Third-Party Services</h2>
        <p className="mb-4">Our Service uses the following third-party services:</p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Cloud Database:</strong> For secure data storage and authentication.</li>
          <li><strong>Apple App Store:</strong> For app distribution on iOS devices. Apple's privacy policy applies to your use of the App Store.</li>
        </ul>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">Your Rights</h2>
        <p className="mb-4">You have the right to:</p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Access your personal data at any time through the app</li>
          <li>Update or correct your account information</li>
          <li>Delete your account and all associated data by contacting us</li>
          <li>Export your worship data upon request</li>
        </ul>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">Children's Privacy</h2>
        <p className="mb-4">
          My Dhikr does not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can take appropriate action.
        </p>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">Changes to This Policy</h2>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" below. We encourage you to review this Privacy Policy periodically.
        </p>

        <h2 className="text-[#227845] text-xl font-bold mt-8 mb-3">Contact Us</h2>
        <p className="mb-4">If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at:</p>
        <p className="mb-4">
          <strong>ZPresso LLC</strong><br />
          Email: <a href="mailto:engrmoshbari@gmail.com" className="text-[#227845] underline">engrmoshbari@gmail.com</a>
        </p>

        <p className="text-[13px] text-[#666] mt-10 pt-6 border-t border-[#e5e7eb]">
          Effective Date: March 17, 2026
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
