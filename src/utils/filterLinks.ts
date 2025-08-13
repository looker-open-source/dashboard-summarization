import { IQueryLink } from "./fetchQueryData";

const filterLinks = (links: IQueryLink[], patterns: string[]) => {
  return links.filter((link) =>
    patterns.some((pattern) => {
      // Support * as a wildcard (like glob), escape other regex chars
      // Escape regex special chars except *
      const escaped = pattern
        .replace(/[-\/\\^$+?.()|[\]{}]/g, "\\$&")
        .replace(/\*/g, ".*");
      try {
        const regex = new RegExp(escaped, "i"); // case-insensitive
        return regex.test(link.url);
      } catch (e) {
        // If invalid regex, skip this pattern
        return false;
      }
    })
  );
};

export default filterLinks;
