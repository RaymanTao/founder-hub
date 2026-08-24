import resourcesData from "@/data/resources.json";
import { Resource } from "@/types/resource";

export const resources = (resourcesData as Resource[])
  .map((resource) => ({
    ...resource,
    archived: resource.archived === true
  }))
  .filter((resource) => !resource.archived);
