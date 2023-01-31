const template = `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
  <head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings
            xmlns:o="urn:schemas-microsoft-com:office:office"
          >
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <style>
        td,
        th,
        div,
        p,
        a,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          font-family: "Segoe UI", sans-serif;
          mso-line-height-rule: exactly;
        }
      </style>
    <![endif]-->
      <title>Your poll has been created</title>
      <style>
.hover-bg-indigo-400:hover {
  background-color: #818cf8 !important;
}
.hover-underline:hover {
  text-decoration: underline !important;
}
.hover-no-underline:hover {
  text-decoration: none !important;
}
@media (max-width: 600px) {
  .sm-w-full {
    width: 100% !important;
  }
  .sm-py-32 {
    padding-top: 32px !important;
    padding-bottom: 32px !important;
  }
  .sm-px-24 {
    padding-left: 24px !important;
    padding-right: 24px !important;
  }
}
</style>
  </head>
  <body style="margin: 0; width: 100%; padding: 0; word-break: break-word; -webkit-font-smoothing: antialiased; background-color: #f3f4f6;">
      <div style="display: none;">
        Please click the link below to verify your email address!&#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &zwnj;
        &#160;&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847;
        &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &zwnj;
        &#160;&#847; &#847; &#847; &#847; &#847;
      </div>
    <div role="article" aria-roledescription="email" aria-label="Your poll has been created" lang="en">
    <table style="width: 100%; font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="background-color: #f3f4f6;">
          <table class="sm-w-full" style="width: 600px;" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td class="sm-py-32 sm-px-24" style="padding-left: 48px; padding-right: 48px; padding-top: 36px; padding-bottom: 36px; text-align: center;">
                <a href="<%= it.homePageUrl %>">
                  <img src="<%= it.homePageUrl %>/logo.png" width="150" alt="Rallly" style="max-width: 100%; vertical-align: middle; line-height: 100%; border: 0;">
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" class="sm-px-24">
                <table style="width: 100%;" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="sm-px-24" style="border-radius: 4px; background-color: #ffffff; padding: 36px; text-align: left; font-size: 16px; line-height: 24px; color: #1f2937;">
                      <p style="margin-bottom: 8px;">Hi <%= it.name %>,</p>
                      <p style="margin-bottom: 8px;">
                        Your poll <strong>"<%= it.title %>"</strong> has been
                        created. Please verify your email address to claim
                        ownership of this&nbsp;poll:
                      </p>
                      <p style="margin-bottom: 24px;"></p>
                      <div style="margin-bottom: 24px; line-height: 100%;">
                        <a id="verifyEmailUrl" href="<%= it.verifyEmailUrl %>" class="hover-bg-indigo-400" style="display: inline-block; border-radius: 4px; background-color: #6366f1; padding-top: 16px; padding-bottom: 16px; padding-left: 24px; padding-right: 24px; text-align: center; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;"> <!--[if mso]><i style="letter-spacing: 27px; mso-font-width: -100%; mso-text-raise: 26pt;">&nbsp;</i><![endif]-->
                          <span style="mso-text-raise: 16px">Verify your email &rarr;
                          </span> <!--[if mso]><i style="letter-spacing: 27px; mso-font-width: -100%;">&nbsp;</i><![endif]-->
                        </a>
                      </div>
                      <p style="margin-bottom: 8px;">
                        In case you lose it, here's a link to your poll for the
                        future 😉
                      </p>
                      <p style="font-weight: 500;">
                        <a id="pollUrl" href="<%= it.pollUrl %>" style="display: inline-block; background-color: #eef2ff; padding: 8px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 20px; color: #6366f1; text-decoration: none;">
                          <%= it.pollUrl %>
                        </a>
                      </p>
                      <table style="width: 100%;" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding-top: 32px; padding-bottom: 32px;">
                            <div style="height: 1px; background-color: #e5e7eb; line-height: 1px;">
                              &zwnj;
                            </div>
                          </td>
                        </tr>
                      </table>
                      <p>
                        Not sure why you received this email? Please
                        <a href="mailto:<%= it.supportEmail %>" class="hover-no-underline" style="color: #6366f1; text-decoration: underline;">let us know</a>.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="height: 48px;"></td>
                  </tr>
                  <tr>
                    <td style="padding-left: 24px; padding-right: 24px; text-align: center; font-size: 12px; color: #4b5563;">
                      <p style="margin-bottom: 4px; text-transform: uppercase;">RALLLY</p>
                      <p style="font-style: italic;">Collaborative Scheduling</p>
                      <p style="cursor: default;">
                        <a href="<%= it.homePageUrl %>" class="hover-underline" style="color: #6366f1; text-decoration: none;">Website</a>
                        &bull;
                        <a href="https://twitter.com/ralllyco" class="hover-underline" style="color: #6366f1; text-decoration: none;">Twitter</a>
                        &bull;
                        <a href="https://github.com/lukevella/rallly" class="hover-underline" style="color: #6366f1; text-decoration: none;">Github</a>
                        &bull;
                        <a href="mailto:<%= it.supportEmail %>" class="hover-underline" style="color: #6366f1; text-decoration: none;">Contact</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    </div>
  </body>
</html>`;

export default template;
