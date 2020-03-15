const isProduction = process.env.NODE_ENV === 'production';

const keyHashMap: {
  [key: string]: number;
} = {};

const registerRequestKey = (key: string): string => {
  let registeredKey = key;

  if (keyHashMap[key]) {
    const newIndex = keyHashMap[key] + 1;

    keyHashMap[key] = newIndex;

    registeredKey = `${key}_${newIndex}`;

    if (!isProduction) {
      console.error(
        `Register Request Key: "${key}" request key already exist. Will be used new key: "${registeredKey}"`
      );
    }
  } else {
    keyHashMap[key] = 1;
  }

  return registeredKey;
};

export default registerRequestKey;
