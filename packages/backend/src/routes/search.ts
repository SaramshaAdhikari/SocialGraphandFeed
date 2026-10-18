import type { FastifyPluginAsync } from 'fastify';
import {
  SearchQuerySchema,
  UniversalSearchResultsSchema,
  type SearchQuery,
} from '@socialgraph/shared';
import { SearchService } from '../services/SearchService.js';
import { getRequestUserId } from './identity.js';

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  const searchService = new SearchService();

  fastify.get<{ Querystring: SearchQuery }>(
    '/search',
    {
      schema: {
        querystring: SearchQuerySchema,
        response: {
          200: UniversalSearchResultsSchema,
        },
      },
    },
    async (request) => {
      const currentUserId = getRequestUserId(request);
      return searchService.search(request.query, currentUserId);
    }
  );
};

export default searchRoutes;
