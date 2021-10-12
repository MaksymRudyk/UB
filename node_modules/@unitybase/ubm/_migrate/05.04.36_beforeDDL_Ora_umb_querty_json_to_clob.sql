<% if (conn.dialect.startsWith('Oracle')) { %>

--@optimistic create table if we migrate from very old version where it not exists
create table ubm_query(
 ID NUMBER(19) not null,
 code NVARCHAR2(50) not null,
 name NVARCHAR2(256) not null,
 ubql NVARCHAR2(2000) not null,
 mi_owner NUMBER(19) not null,
 mi_createDate DATE default CAST(sys_extract_utc(SYSTIMESTAMP) AS DATE) not null,
 mi_createUser NUMBER(19) not null,
 mi_modifyDate DATE default CAST(sys_extract_utc(SYSTIMESTAMP) AS DATE) not null,
 mi_modifyUser NUMBER(19) not null,
 mi_deleteDate DATE default TO_DATE('31.12.9999', 'dd.mm.yyyy') not null,
 mi_deleteUser NUMBER(19) null
);
--

ALTER TABLE ubm_query ADD (ubql_c CLOB);
--
UPDATE ubm_query SET ubql_c = ubql WHERE 1=1;
--
ALTER TABLE ubm_query DROP COLUMN ubql;
--
ALTER TABLE ubm_query RENAME COLUMN ubql_c TO ubql;
--
<% } %>