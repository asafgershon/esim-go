export default {
    schema: [
        "./server/server/schema.graphql",
        "./server/packages/rules-engine/schema.graphql",
    ],
    documents: [
        "./client/web-app/src/**/*.{graphql,js,ts}",
        "./client/dashboard/src/**/*.{graphql,js,ts}",
    ],
    tagName: "gql",
    ignoreNoDocuments: true,
}