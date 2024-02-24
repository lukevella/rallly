-- Unset non-geographic time zones
UPDATE users SET time_zone = NULL WHERE time_zone NOT LIKE '%/%' OR time_zone LIKE 'Etc/%';
