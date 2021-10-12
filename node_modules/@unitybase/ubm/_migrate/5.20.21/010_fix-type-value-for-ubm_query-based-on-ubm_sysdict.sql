-- Set valid type `sysDict` for entries of `ubm_query` entity mapped from the `ubm_sysdictionary` entity
-- Was fixed in the https://git-pub.intecracy.com/unitybase/ubjs/-/commit/55d605b5c3d030b208ef96117c878fbe39343856

update ubm_query
set type = 'sysDict'
where mi_unityEntity = 'ubm_sysdictionary' and type <> 'sysDict';
