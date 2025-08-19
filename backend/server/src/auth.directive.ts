import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLError, GraphQLSchema } from "graphql";
import { createSupabaseAuthContext, getUserRole } from "./context/supabase-auth";

function authDirective(directiveName: string) {
  const typeDirectiveArgumentMaps: Record<string, any> = {};
  return {
    authDirectiveTypeDefs: `directive @${directiveName}(role: String) on OBJECT | FIELD_DEFINITION
  `,
    authDirectiveTransformer: (schema: GraphQLSchema) =>
      mapSchema(schema, {
        [MapperKind.TYPE]: (type) => {
          const authDirective = getDirective(schema, type, directiveName)?.[0];
          if (authDirective) {
            typeDirectiveArgumentMaps[type.name] = authDirective;
          }
          return undefined;
        },
        [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, typeName) => {
          const authDirective =
            getDirective(schema, fieldConfig, directiveName)?.[0] ??
            typeDirectiveArgumentMaps[typeName];

          if (!authDirective) {
            return fieldConfig;
          }

          const { resolve = defaultFieldResolver } = fieldConfig;
          fieldConfig.resolve = async function (source, args, context, info) {
            // Check if auth context is already populated (from app.ts)
            let auth = context.auth;
            
            // If not authenticated via context, try to create auth from token
            if (!auth?.isAuthenticated && context.token) {
              auth = await createSupabaseAuthContext(context.token);
            }
            
            if (!auth?.isAuthenticated) {
              throw new GraphQLError("Not authorized", {
                extensions: {
                  code: "UNAUTHORIZED",
                },
              });
            }

            // Check role-based access if role is specified
            if (authDirective.role) {
              const userRole = getUserRole(auth.supabaseUser);
              const requiredRole = authDirective.role;
              
              // Check if user has the required role
              if (userRole !== requiredRole) {
                // Also allow ADMIN to access everything
                if (userRole !== "ADMIN") {
                  throw new GraphQLError("Insufficient permissions", {
                    extensions: {
                      code: "FORBIDDEN",
                      requiredRole,
                      userRole,
                    },
                  });
                }
              }
            }
            
            return resolve(source, args, { ...context, auth }, info);
          };
          return fieldConfig;
        },
      }),
  };
}

export const { authDirectiveTypeDefs, authDirectiveTransformer } =
  authDirective("auth");
