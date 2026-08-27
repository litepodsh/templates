# Host prerequisite: `vm.max_map_count`

Elasticsearch needs a raised mmap limit on the host kernel, or the container
exits during bootstrap checks:

```sh
sudo sysctl -w vm.max_map_count=262144
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf
```

# Image version

Elastic publishes no `:latest` / rolling tag. `compose.yml` pins a GA release;
check <https://www.docker.elastic.co> and bump it before adopting. Never point an
older image at a newer `elasticsearch_data` volume.

# Access

Security is on. Authenticate as the `elastic` user with `ELASTICSEARCH_PASSWORD`:

```sh
curl -u elastic:$ELASTICSEARCH_PASSWORD http://elasticsearch:9200/_cluster/health
```

To add Kibana or other Elastic components, create their service accounts / tokens
with `elasticsearch-service-tokens` or `elasticsearch-reset-password` inside the
container.

# Memory

Set `ELASTICSEARCH_JAVA_OPTS` (`-Xms` == `-Xmx`) to about half the container's
RAM. `bootstrap.memory_lock` is enabled and the `memlock` ulimit is unlimited in
`compose.yml` so the heap is never swapped.
