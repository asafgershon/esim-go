import React from "react";

const AuthMetaTags = () => (
  <>
    <meta
      name="appleid-signin-client-id"
      content={process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || ""}
    />
    <meta name="appleid-signin-scope" content="name email" />
    <meta
      name="appleid-signin-redirect-uri"
      content={process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || ""}
    />
    <meta name="appleid-signin-state" content="origin:web" />
    <meta name="appleid-signin-use-popup" content="false" />
    <meta
      name="google-signin-client_id"
      content={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
    />
  </>
);

export default AuthMetaTags; 