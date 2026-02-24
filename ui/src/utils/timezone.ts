export interface TimezoneOption {
    value: string;
    label: string;
    offsetMinutes: number;
}

export function getAllTimezones(): TimezoneOption[] {
    const timezones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['UTC'];
    const now = new Date();

    const options = timezones.map(tz => {
        let offsetMinutes = 0;
        try {
            const parts = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                timeZoneName: 'shortOffset'
            }).formatToParts(now);

            const tzNamePart = parts.find(p => p.type === 'timeZoneName');
            let val = tzNamePart ? tzNamePart.value.replace('GMT', '') : '';
            if (!val) val = '+0';

            const [h, m] = val.split(':');
            offsetMinutes = parseInt(h) * 60;
            if (m) {
                offsetMinutes += (offsetMinutes < 0 ? -1 : 1) * parseInt(m);
            }

            const sign = offsetMinutes >= 0 ? '+' : '-';
            const absMins = Math.abs(offsetMinutes);
            const hh = String(Math.floor(absMins / 60)).padStart(2, '0');
            const mm = String(absMins % 60).padStart(2, '0');

            return {
                value: tz,
                label: `(UTC${sign}${hh}:${mm}) ${tz.replace(/_/g, ' ')}`,
                offsetMinutes
            };
        } catch {
            return { value: tz, label: tz, offsetMinutes: 0 };
        }
    });

    return options.sort((a, b) => {
        if (a.offsetMinutes !== b.offsetMinutes) return a.offsetMinutes - b.offsetMinutes;
        return a.value.localeCompare(b.value);
    });
}

const TIMEZONE_STORAGE_KEY = 'admin_ui_timezone';

export function getUserTimezone(): string {
    // Check local storage first
    const storedTz = localStorage.getItem(TIMEZONE_STORAGE_KEY);
    if (storedTz) {
        return storedTz;
    }

    // Fallback to browser timezone
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
        return 'UTC'; // Ultimate fallback
    }
}

export function setUserTimezone(tz: string): void {
    localStorage.setItem(TIMEZONE_STORAGE_KEY, tz);
}
