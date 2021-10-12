<% if (conn.dialect.startsWith('Postgre')) { %>

--
alter table ubm_query add type VARCHAR(32) null;
--
alter table ubm_query add mi_unityEntity VARCHAR(64) null;
--
update ubm_query
set type = 'sysDict'
where type is null;
--
update ubm_query
set mi_unityEntity = ID
where mi_unityEntity is null;
--
alter table ubm_query alter column type set not null;
--
alter table ubm_query alter column mi_unityEntity set not null;
--

<% } else if (conn.dialect.startsWith('MSSQL')) { %>

--
alter table dbo.ubm_query add type VARCHAR(32) null;
--
alter table dbo.ubm_query add mi_unityEntity VARCHAR(64) null;
--
update dbo.ubm_query
set type = 'sysDict'
where type is null;
--
update dbo.ubm_query
set mi_unityEntity = ID
where mi_unityEntity is null;
--
alter table dbo.ubm_query alter column type VARCHAR(32) not null;
--
alter table dbo.ubm_query alter column mi_unityEntity VARCHAR(64) not null;
--

<% } else if (conn.dialect.startsWith('Oracle')) { %>

--
alter table ubm_query add type VARCHAR2(32) null;
--
alter table ubm_query add mi_unityEntity VARCHAR2(32) null;
--
update ubm_query
set type = 'sysDict'
where type is null;
--
update ubm_query
set mi_unityentity = id
where mi_unityentity is null;
--
alter table ubm_query modify type not null;
--
alter table ubm_query modify mi_unityEntity not null;
--

<% } %>
