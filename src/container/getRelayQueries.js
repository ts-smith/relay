/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getRelayQueries
 * @flow
 */

'use strict';

var Map = require('Map');
import type {
  RelayLazyContainer,
  RelayQueryConfig
} from 'RelayContainer';
import type {RelayQuerySet} from 'RelayInternalTypes';
var RelayMetaRoute = require('RelayMetaRoute');
var RelayProfiler = require('RelayProfiler');
var RelayQuery = require('RelayQuery');

var buildRQL = require('buildRQL');
var invariant = require('invariant');
var stableStringify = require('stableStringify');

var queryCache = new Map();

/**
 * @internal
 *
 * `getRelayQueries` retrieves all queries for a component given a route.
 */
function getRelayQueries(
  Component: RelayLazyContainer,
  route: RelayQueryConfig
): RelayQuerySet {
  if (!queryCache.has(Component)) {
    queryCache.set(Component, {});
  }
  var cacheKey = route.name + ':' + stableStringify(route.params);
  var cache = queryCache.get(Component);
  if (cache.hasOwnProperty(cacheKey)) {
    return cache[cacheKey];
  }
  var querySet = {};
  var unmatchedNameMap = {};
  Object.keys(route.queries).forEach(queryName => {
    unmatchedNameMap[queryName] = true;
  });
  Component.getFragmentNames().forEach(fragmentName => {
    var queryName = fragmentName;
    var queryBuilder = route.queries[queryName];
    if (queryBuilder) {
      delete unmatchedNameMap[queryName];
      var concreteQuery = buildRQL.Query(
        queryBuilder,
        Component,
        Object.keys(route.params)
      );
      invariant(
        concreteQuery !== undefined,
        'Relay.QL defined on route `%s` named `%s` is not a valid query. ' +
        'A typical query is defined using: Relay.QL`query {...}`',
        route.name,
        queryName
      );
      if (concreteQuery) {
        var rootQuery = RelayQuery.Node.createQuery(
          concreteQuery,
          RelayMetaRoute.get(route.name),
          route.params
        );
        var rootCall = rootQuery.getRootCall();
        if (rootCall.value !== undefined) {
          querySet[fragmentName] = rootQuery;
          return;
        }
      }
    } else {
      unmatchedNameMap[queryName] = true;
    }
    querySet[fragmentName] = null;
  });
  var unmatchedNames = Object.keys(unmatchedNameMap);
  invariant(
    unmatchedNames.length === 0,
    'getRelayQueries: %s.fragments and %s.queries have unmatched fragment ' +
    'names. Make sure that both define: %s',
    Component.displayName,
    route.name,
    unmatchedNames.join(', ')
  );
  cache[cacheKey] = querySet;
  return querySet;
}

module.exports = RelayProfiler.instrument('Relay.getQueries', getRelayQueries);
