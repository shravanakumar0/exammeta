import { moduleDetails } from "./moduleDetails";

export const studyResources = Object.entries(moduleDetails).flatMap(([branch, semesters]) =>
  Object.entries(semesters).flatMap(([semester, subjects]) =>
    (Array.isArray(subjects) ? subjects : []).flatMap((subject, subjectIndex) => {
      const subjectKey = `${branch}-${semester}-${subject.code || subject.title}`;

      return (subject.modules || [])
        .filter(resource => resource.previewUrl || resource.fileUrl)
        .map((resource, resourceIndex) => ({
          id: `${subjectKey}-${subjectIndex}-${resource.id || resource.title}-${resourceIndex}`,
          subjectKey,
          subject: subject.title,
          code: subject.code || "",
          branch,
          semester,
          resource,
          url: resource.previewUrl || resource.fileUrl
        }));
    })
  )
);

export const getResourceModuleNumber = ({ resource }) => {
  const moduleTag = (resource.tags || []).find(tag => /^module-\d+$/i.test(tag));
  const titleMatch = resource.title?.match(/module\s+(\d+)/i);
  const match = moduleTag?.match(/\d+/) || titleMatch;
  return match ? Number(match[0]) : null;
};

export const isQuestionResource = ({ resource }) =>
  /question|pyq|paper|important/i.test(
    `${resource.type || ""} ${resource.category || ""} ${resource.title || ""}`
  );

export const isAnswerResource = ({ resource }) =>
  /solution|answer|solved/i.test(
    `${resource.type || ""} ${resource.category || ""} ${resource.title || ""}`
  );
