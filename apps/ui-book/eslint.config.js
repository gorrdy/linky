import config from "@linky-fit/config/eslint";

export default [...config, { ignores: [".expo/**", "dist-native/**"] }];
