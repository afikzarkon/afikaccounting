/** "ב" before a name: joined to a Hebrew word ("בחשבונאות מאפס"), with a maqaf before Latin letters or digits ("ב־IAS 16"). */
export const inName = (name: string) => (/^[A-Za-z0-9]/.test(name) ? `ב־${name}` : `ב${name}`);
