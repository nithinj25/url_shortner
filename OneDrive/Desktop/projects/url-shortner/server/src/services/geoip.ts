import { resolve, resolveSrv } from "dns";
import https from "http";
import { random } from "nanoid";

interface GeoIPResult {
    country: string;
    city: string;
    status: "success" | "fail";
}

export const getGeoFromIP = (ip: string): Promise<GeoIPResult> => {
    return new Promise((resolve) => {
        const privateRange = ["127." , "192.168", "10.", "::1" , "localhost"];
        const isPrivate = privateRange.some((Range) => ip.startsWith(Range));

        if(isPrivate){
            resolve({ country: "Unknown", city: "Unknow", status: "success"});
            return;
        }

        https.get(`https://ip-api.com/json/${ip}?fields=status,country,city`, (res) => {
            let data = "";

            res.on("data", (chunk) => (data += chunk));

            res.on("end", () => {
                try{
                    const parsed: GeoIPResult = JSON.parse(data);
                    resolve(parsed);
                } catch {
                    resolve({ country: "Unknown" , city: "Unknown", status: "fail"});
                }
            });
        }).on("error", () => {
            resolve({ country: "Unkonw", city: "unknown", status:"fail"});
        });
    });
};

export interface ParsedUA {
    device: string;
    browser: string;
    os: string;
}

export const parseUserAgent = (ua: string): ParsedUA => {
    if(!ua) return { device: "unknown", browser: "unknown", os: "unknown"};

    let device = "Desktop";
    if(/mobile/i.test(ua)) device = "Mobile";
    if(/tablet/i.test(ua)) device = "Tablet";
    if(/ipad/i.test(ua))   device = "Tablet";

  // Browser — order matters! Chrome UA also contains Safari
    let browser = "Unknown";
    if (/edg/i.test(ua))     browser = "Edge";
    else if (/chrome/i.test(ua))   browser = "Chrome";
    else if (/firefox/i.test(ua))  browser = "Firefox";
    else if (/safari/i.test(ua))   browser = "Safari";
    else if (/opera/i.test(ua))    browser = "Opera";

    // OS
    let os = "Unknown";
    if (/windows/i.test(ua))  os = "Windows";
    else if (/android/i.test(ua))  os = "Android";
    else if (/iphone|ipad/i.test(ua)) os = "iOS";
    else if (/mac/i.test(ua))      os = "macOS";
    else if (/linux/i.test(ua))    os = "Linux";

    return { device, browser, os };
}