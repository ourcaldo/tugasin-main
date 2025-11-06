# Google Tag Manager (GTM) Setup Guide

## Overview
Google Tag Manager has been integrated into the Tugasin analytics stack. GTM provides centralized tag management, allowing you to add and update marketing tags without modifying the codebase.

## Environment Configuration

### Development/Staging
In `.env.example`, the GTM container ID is set to a placeholder:
```bash
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX
```

### Production Setup
1. Create a GTM container at [Google Tag Manager](https://tagmanager.google.com/)
2. Copy your container ID (format: `GTM-XXXXXXX`)
3. Update your production environment variables:
   ```bash
   NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-YOUR_ACTUAL_ID
   ```

### Environment-Specific Containers (Optional)
For staging/testing environments, you can use GTM environment parameters:
```bash
NEXT_PUBLIC_GTM_CONTAINER_ID=GTM-XXXXXXX
GTM_AUTH=your_auth_string
GTM_PREVIEW=your_preview_string
```

## Features Implemented

### Automatic Event Tracking
GTM automatically captures the following events:

1. **Page Views**
   - Triggered on every page navigation
   - Includes: page title, path, URL, referrer

2. **Custom Events**
   - All custom events tracked via the analytics system
   - Includes: category, action, label, value

3. **User Identification**
   - Tracks logged-in users
   - Includes: user ID and custom traits

### Integration Benefits

1. **Tag Management**: Add/update tracking tags without code changes
2. **A/B Testing**: Implement experiments via GTM
3. **Conversion Tracking**: Set up conversion goals and pixels
4. **Multiple Platforms**: Facebook Pixel, LinkedIn Insight, etc.
5. **Server-Side Tagging**: Enhanced privacy and reliability

## Implementation Details

### Plugin Architecture
- Located in: `lib/analytics/plugins/gtm-plugin.ts`
- Follows the same pattern as GA4, PostHog, and Sentry plugins
- Integrates with getanalytics.io framework

### Script Loading
- GTM script loads asynchronously for optimal performance
- Includes noscript fallback for non-JavaScript browsers
- Error handling for ad blockers and CSP issues

### DataLayer Structure
GTM events are pushed to the `dataLayer` in the following format:

**Page View:**
```javascript
{
  event: 'page_view',
  page: {
    title: 'Page Title',
    path: '/path',
    url: 'https://tugasin.me/path',
    referrer: 'https://previous-page.com'
  }
}
```

**Custom Event:**
```javascript
{
  event: 'event_name',
  eventCategory: 'category',
  eventAction: 'event_name',
  eventLabel: 'label',
  eventValue: 123,
  // ...additional properties
}
```

**User Identification:**
```javascript
{
  event: 'user_identified',
  userId: 'user123',
  userTraits: {
    email: 'user@example.com',
    // ...other traits
  }
}
```

## GTM Container Setup

### Recommended Tags
Once GTM is active, you can add these tags through the GTM dashboard:

1. **Google Analytics 4**
   - Note: GA4 is already implemented directly, but you can add it to GTM for consolidated management

2. **Facebook Pixel**
3. **LinkedIn Insight Tag**
4. **Hotjar**
5. **Custom HTML/JavaScript tags**

### Triggers
Create triggers based on the events above:
- Page View: Trigger on `page_view` event
- Custom Events: Trigger on specific event names
- User Identification: Trigger on `user_identified` event

## Testing

### Development Mode
In development, GTM will log debug information to the browser console:
- Container loading status
- Initialization confirmation
- Error messages (if any)

### GTM Preview Mode
Use GTM's built-in preview mode to test tags before publishing:
1. Open GTM dashboard
2. Click "Preview" button
3. Enter your development URL
4. View tag firing in real-time

## Troubleshooting

### GTM Not Loading
1. Check that `NEXT_PUBLIC_GTM_CONTAINER_ID` is set correctly
2. Verify container ID format: `GTM-XXXXXXX`
3. Check browser console for errors
4. Disable ad blockers temporarily

### Events Not Firing
1. Open GTM Preview Mode
2. Navigate through your site
3. Check dataLayer events in preview panel
4. Verify triggers are configured correctly

### CSP Issues
If Content Security Policy blocks GTM:
1. Check `next.config.js` CSP settings
2. Ensure `https://www.googletagmanager.com` is allowed
3. Add to `script-src` and `connect-src` directives

## Production Checklist

Before deploying to production:
- [ ] GTM container created and configured
- [ ] Container ID updated in production environment
- [ ] Essential tags added and tested
- [ ] Triggers configured correctly
- [ ] Privacy settings configured (GDPR/CCPA compliance)
- [ ] GTM container published (not in draft)
- [ ] Verified tags firing in GTM Preview Mode

## Support

For GTM-specific questions:
- [GTM Documentation](https://support.google.com/tagmanager)
- [GTM Community](https://www.en.advertisercommunity.com/t5/Google-Tag-Manager/bd-p/Google_Tag_Manager)

For implementation questions, refer to:
- `lib/analytics/plugins/gtm-plugin.ts` - Plugin implementation
- `lib/analytics/config.ts` - Analytics configuration
- `project.md` - Project changelog
