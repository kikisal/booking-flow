import {config} from "./config";

export function getStrings(lang: string) {
    const strings = config.strings[lang as keyof typeof config.strings];
    if (!strings) 
        return config.strings.en;

    return strings;
};