/**
 * Extract pagination params from query string
 * Returns { page, limit, offset, sort, order }
 */
function paginate(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const sort = query.sort || 'created_at';
  const order = (query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Whitelist sort columns to prevent SQL injection
  const allowedSorts = [
    'id', 'created_at', 'updated_at', 'name', 'email', 'status',
    'total_amount', 'order_date', 'due_date', 'amount', 'paid_amount',
    'quantity', 'unit_price', 'base_price', 'display_name', 'title',
    'requested_at', 'received_at', 'dispatched_at', 'delivered_at',
    'quote_expiry', 'movement_type', 'occurred_at',
  ];

  const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';

  return { page, limit, offset, sort: sortCol, order };
}

/**
 * Build paginated query with LIMIT/OFFSET and total count
 */
async function paginateQuery(client, baseQuery, params, pageOpts) {
  const queryFn = typeof client === 'function' ? client : (text, params) => client.query(text, params);
  const dbClient = typeof client === 'object' && client.query ? client : client;

  // Add LIMIT/OFFSET
  const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const paginatedParams = [...params, pageOpts.limit, pageOpts.offset];

  const result = await queryFn.call
    ? queryFn(paginatedQuery, paginatedParams)
    : dbClient.query(paginatedQuery, paginatedParams);

  return result;
}

/**
 * Build pagination response wrapper
 */
function paginateResponse(data, { page, limit }, total) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

module.exports = { paginate, paginateQuery, paginateResponse };
