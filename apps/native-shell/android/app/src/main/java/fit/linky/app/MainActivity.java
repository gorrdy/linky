package fit.linky.app;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcelable;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.view.View;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.journeyapps.barcodescanner.ScanContract;
import com.journeyapps.barcodescanner.ScanIntentResult;
import com.journeyapps.barcodescanner.ScanOptions;

import org.json.JSONObject;

import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class MainActivity extends BridgeActivity {
	private static final String EVENT_DEEP_LINK = "linky-native-deep-link";
	private static final String EVENT_NOTIFICATION_PERMISSION = "linky-native-notification-permission";
	private static final String EVENT_SCAN_RESULT = "linky-native-scan-result";
	private static final String PREFS_NAME = "linky.native.bridge";
	private static final String PREF_PENDING_DEEP_LINK_URL = "pending_deep_link_url";
	private static final String PREF_NOTIFICATION_PERMISSION_REQUESTED = "notification_permission_requested";
	private static final String FIREBASE_GOOGLE_APP_ID_RESOURCE = "google_app_id";
	private int latestBottomInsetPx = 0;
	private int latestKeyboardInsetPx = 0;
	private int latestTopInsetPx = 0;

	private ActivityResultLauncher<String> notificationPermissionLauncher;
	private ActivityResultLauncher<ScanOptions> qrScanLauncher;
	private SharedPreferences bridgePreferences;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		bridgePreferences = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
		cacheIntentDeepLinkUrl(getIntent());

		notificationPermissionLauncher = registerForActivityResult(
			new ActivityResultContracts.RequestPermission(),
			isGranted -> dispatchWindowEvent(
				EVENT_NOTIFICATION_PERMISSION,
				createPermissionDetail(isGranted ? "granted" : getNotificationPermissionState())
			)
		);

		qrScanLauncher = registerForActivityResult(new ScanContract(), this::handleScanResult);

		WebView webView = getBridgeWebView();
		if (webView == null) {
			return;
		}

		webView.addJavascriptInterface(new LinkySecretStorageBridge(this), "LinkyNativeSecretStorage");
		webView.addJavascriptInterface(new LinkyNativeScannerBridge(), "LinkyNativeScanner");
		webView.addJavascriptInterface(new LinkyNativeNotificationsBridge(), "LinkyNativeNotifications");
		webView.addJavascriptInterface(new LinkyNativeWindowInsetsBridge(), "LinkyNativeWindowInsets");
		webView.addJavascriptInterface(new LinkyNativeDeepLinksBridge(), "LinkyNativeDeepLinks");

		ViewCompat.setOnApplyWindowInsetsListener(webView, (View view, WindowInsetsCompat insets) -> {
			Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
			Insets imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime());
			boolean isImeVisible = insets.isVisible(WindowInsetsCompat.Type.ime());
			latestTopInsetPx = Math.max(0, systemBars.top);
			latestBottomInsetPx = Math.max(0, systemBars.bottom);
			latestKeyboardInsetPx = isImeVisible
				? Math.max(0, imeInsets.bottom - latestBottomInsetPx)
				: 0;
			dispatchSafeAreaInsets();
			return insets;
		});

		webView.post(() -> {
			ViewCompat.requestApplyInsets(webView);
			dispatchSafeAreaInsets();
		});
	}

	@Override
	public void onResume() {
		super.onResume();
		WebView webView = getBridgeWebView();
		if (webView != null) {
			webView.post(() -> {
				ViewCompat.requestApplyInsets(webView);
				dispatchSafeAreaInsets();
			});
		}
	}

	@Override
	protected void onNewIntent(Intent intent) {
		super.onNewIntent(intent);
		setIntent(intent);

		String deepLinkUrl = extractDeepLinkUrl(intent);
		if (deepLinkUrl == null) {
			return;
		}

		cachePendingDeepLinkUrl(deepLinkUrl);
		dispatchDeepLinkUrl(deepLinkUrl);
	}

	private void handleScanResult(ScanIntentResult result) {
		JSONObject detail = new JSONObject();

		try {
			String value = result.getContents();
			if (value != null && !value.trim().isEmpty()) {
				detail.put("status", "success");
				detail.put("value", value.trim());
			} else {
				detail.put("status", "cancelled");
			}
		} catch (Exception error) {
			try {
				detail.put("status", "error");
				detail.put("message", error.getMessage() == null ? "Scanner failed" : error.getMessage());
			} catch (Exception ignored) {
				// ignore secondary JSON errors
			}
		}

		dispatchWindowEvent(EVENT_SCAN_RESULT, detail);
	}

	private Bridge getCapacitorBridge() {
		return getBridge();
	}

	private WebView getBridgeWebView() {
		Bridge bridge = getCapacitorBridge();
		return bridge == null ? null : bridge.getWebView();
	}

	private void dispatchWindowEvent(String eventName, JSONObject detail) {
		WebView webView = getBridgeWebView();
		if (webView == null) {
			return;
		}

		String payload = detail == null ? "{}" : detail.toString();
		String script = "window.dispatchEvent(new CustomEvent(" + JSONObject.quote(eventName) + ", { detail: " + payload + " }));";

		runOnUiThread(() -> webView.evaluateJavascript(script, null));
	}

	private JSONObject createPermissionDetail(String permission) {
		JSONObject detail = new JSONObject();

		try {
			detail.put("permission", permission);
		} catch (Exception ignored) {
			// ignore JSON bridge payload failures
		}

		return detail;
	}

	private void dispatchSafeAreaInsets() {
		JSONObject detail = new JSONObject();

		try {
			detail.put("topInsetPx", latestTopInsetPx);
			detail.put("bottomInsetPx", latestBottomInsetPx);
			detail.put("keyboardInsetPx", latestKeyboardInsetPx);
		} catch (Exception ignored) {
			// ignore JSON bridge payload failures
		}

		dispatchWindowEvent("linky-native-window-insets", detail);
	}

	private void dispatchDeepLinkUrl(String url) {
		String normalized = url == null ? "" : url.trim();
		if (normalized.isEmpty()) {
			return;
		}

		JSONObject detail = new JSONObject();

		try {
			detail.put("url", normalized);
		} catch (Exception ignored) {
			// ignore JSON bridge payload failures
		}

		dispatchWindowEvent(EVENT_DEEP_LINK, detail);
	}

	private String extractDeepLinkUrl(Intent intent) {
		if (intent == null) {
			return null;
		}

		String action = intent.getAction();
		if (Intent.ACTION_VIEW.equals(action)) {
			if (intent.getData() == null) {
				return null;
			}

			String url = intent.getDataString();
			if (url == null) {
				return null;
			}

			String normalized = normalizeDeepLinkCandidate(url);
			return normalized == null ? null : normalized;
		}

		if (!NfcAdapter.ACTION_NDEF_DISCOVERED.equals(action)
			&& !NfcAdapter.ACTION_TAG_DISCOVERED.equals(action)
			&& !NfcAdapter.ACTION_TECH_DISCOVERED.equals(action)) {
			return null;
		}

		return extractNfcDeepLinkUrl(intent);
	}

	private String extractNfcDeepLinkUrl(Intent intent) {
		Parcelable[] rawMessages = intent.getParcelableArrayExtra(NfcAdapter.EXTRA_NDEF_MESSAGES);
		if (rawMessages == null || rawMessages.length == 0) {
			return null;
		}

		for (Parcelable rawMessage : rawMessages) {
			if (!(rawMessage instanceof NdefMessage)) {
				continue;
			}

			NdefMessage message = (NdefMessage) rawMessage;
			for (NdefRecord record : message.getRecords()) {
				String candidate = extractDeepLinkFromNdefRecord(record);
				if (candidate != null) {
					return candidate;
				}
			}
		}

		return null;
	}

	private String extractDeepLinkFromNdefRecord(NdefRecord record) {
		if (record == null) {
			return null;
		}

		android.net.Uri uri = record.toUri();
		if (uri != null) {
			String normalized = normalizeDeepLinkCandidate(uri.toString());
			if (normalized != null) {
				return normalized;
			}
		}

		short tnf = record.getTnf();
		byte[] type = record.getType();

		if (tnf == NdefRecord.TNF_WELL_KNOWN && Arrays.equals(type, NdefRecord.RTD_TEXT)) {
			return normalizeDeepLinkCandidate(readTextRecordPayload(record.getPayload()));
		}

		if (tnf == NdefRecord.TNF_MIME_MEDIA) {
			String mimeType = readAsciiBytes(type);
			if ("text/plain".equalsIgnoreCase(mimeType)) {
				return normalizeDeepLinkCandidate(readUtf8Payload(record.getPayload()));
			}
		}

		return null;
	}

	private String readAsciiBytes(byte[] bytes) {
		if (bytes == null || bytes.length == 0) {
			return "";
		}

		return new String(bytes, StandardCharsets.US_ASCII).trim();
	}

	private String readUtf8Payload(byte[] payload) {
		if (payload == null || payload.length == 0) {
			return "";
		}

		return new String(payload, StandardCharsets.UTF_8).trim();
	}

	private String readTextRecordPayload(byte[] payload) {
		if (payload == null || payload.length == 0) {
			return null;
		}

		int status = payload[0] & 0xFF;
		boolean isUtf16 = (status & 0x80) != 0;
		int languageCodeLength = status & 0x3F;
		if (payload.length <= 1 + languageCodeLength) {
			return null;
		}

		Charset charset = isUtf16 ? StandardCharsets.UTF_16 : StandardCharsets.UTF_8;
		return new String(
			payload,
			1 + languageCodeLength,
			payload.length - 1 - languageCodeLength,
			charset
		).trim();
	}

	private String normalizeDeepLinkCandidate(String value) {
		if (value == null) {
			return null;
		}

		String normalized = value.trim();
		if (normalized.isEmpty()) {
			return null;
		}

		String lower = normalized.toLowerCase();
		if (lower.startsWith("nostr://") || lower.startsWith("cashu://")) {
			return normalized;
		}

		return null;
	}

	private void cacheIntentDeepLinkUrl(Intent intent) {
		String deepLinkUrl = extractDeepLinkUrl(intent);
		if (deepLinkUrl == null) {
			return;
		}

		cachePendingDeepLinkUrl(deepLinkUrl);
	}

	private void cachePendingDeepLinkUrl(String url) {
		String normalized = url == null ? "" : url.trim();
		if (normalized.isEmpty()) {
			return;
		}

		bridgePreferences.edit().putString(PREF_PENDING_DEEP_LINK_URL, normalized).apply();
	}

	private String consumePendingDeepLinkUrl() {
		String pendingUrl = bridgePreferences.getString(PREF_PENDING_DEEP_LINK_URL, null);
		if (pendingUrl == null) {
			return null;
		}

		String normalized = pendingUrl.trim();
		bridgePreferences.edit().remove(PREF_PENDING_DEEP_LINK_URL).apply();
		return normalized.isEmpty() ? null : normalized;
	}

	private String getNotificationPermissionState() {
		if (!isNativePushSupported()) {
			return "unsupported";
		}

		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
			return "granted";
		}

		if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
			== PackageManager.PERMISSION_GRANTED) {
			return "granted";
		}

		boolean wasRequested = bridgePreferences.getBoolean(PREF_NOTIFICATION_PERMISSION_REQUESTED, false);
		return wasRequested ? "denied" : "prompt";
	}

	private boolean isNativePushSupported() {
		return getResources().getIdentifier(
			FIREBASE_GOOGLE_APP_ID_RESOURCE,
			"string",
			getPackageName()
		) != 0;
	}

	private final class LinkyNativeScannerBridge {
		@JavascriptInterface
		public void startScan() {
			runOnUiThread(() -> {
				ScanOptions options = new ScanOptions();
				options.setDesiredBarcodeFormats(ScanOptions.QR_CODE);
				options.setBeepEnabled(false);
				options.setOrientationLocked(false);
				options.setPrompt("Scan QR code");
				qrScanLauncher.launch(options);
			});
		}
	}

	private final class LinkyNativeNotificationsBridge {
		@JavascriptInterface
		public boolean areSupported() {
			return isNativePushSupported();
		}

		@JavascriptInterface
		public String getPermissionState() {
			return getNotificationPermissionState();
		}

		@JavascriptInterface
		public void requestPermission() {
			if (!isNativePushSupported()) {
				dispatchWindowEvent(
					EVENT_NOTIFICATION_PERMISSION,
					createPermissionDetail("unsupported")
				);
				return;
			}

			if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
				dispatchWindowEvent(
					EVENT_NOTIFICATION_PERMISSION,
					createPermissionDetail("granted")
				);
				return;
			}

			bridgePreferences.edit().putBoolean(PREF_NOTIFICATION_PERMISSION_REQUESTED, true).apply();

			runOnUiThread(() -> notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS));
		}
	}

	private final class LinkyNativeWindowInsetsBridge {
		@JavascriptInterface
		public int getBottomInsetPx() {
			return latestBottomInsetPx;
		}

		@JavascriptInterface
		public int getTopInsetPx() {
			return latestTopInsetPx;
		}

		@JavascriptInterface
		public int getKeyboardInsetPx() {
			return latestKeyboardInsetPx;
		}
	}

	private final class LinkyNativeDeepLinksBridge {
		@JavascriptInterface
		public String consumePendingUrl() {
			return consumePendingDeepLinkUrl();
		}
	}
}
