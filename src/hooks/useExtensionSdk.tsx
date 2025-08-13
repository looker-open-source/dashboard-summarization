import { ExtensionContext } from "@looker/extension-sdk-react";
import { useContext } from "react";

const useExtensionSdk = () => {
  const extensionContext = useContext(ExtensionContext);
  if (!extensionContext) {
    throw new Error("ExtensionContext not found");
  }
  if (!extensionContext.extensionSDK) {
    throw new Error("ExtensionSDK not found");
  }
  return extensionContext.extensionSDK;
};

export default useExtensionSdk;
