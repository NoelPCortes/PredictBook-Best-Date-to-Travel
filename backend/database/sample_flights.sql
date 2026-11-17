-- Invented sample data, not real schedules. Requires the seed username in
-- predictbook.seed_staff_username and the project's zone as the session TimeZone.
BEGIN;
SELECT setseed(0.42);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM accounts_user
        WHERE username = current_setting('predictbook.seed_staff_username', true)
          AND role IN ('staff', 'head')
    ) THEN
        RAISE EXCEPTION 'Seed Staff user is missing. Run python manage.py seed_staff first; supply SEED_STAFF_USERNAME as predictbook.seed_staff_username.';
    END IF;
END $$;

INSERT INTO flights_airline (name, code) VALUES
    ('Cebu Pacific', '5J'), ('Singapore Airlines', 'SQ'),
    ('Philippine Airlines', 'PR'), ('AirAsia Philippines', 'Z2'),
    ('ANA All Nippon Airways', 'NH')
ON CONFLICT DO NOTHING;

INSERT INTO flights_airport (code, name, city, country) VALUES
    ('MNL', 'Ninoy Aquino International Airport', 'Manila', 'Philippines'),
    ('CEB', 'Mactan-Cebu International Airport', 'Cebu', 'Philippines'),
    ('DVO', 'Francisco Bangoy International Airport', 'Davao', 'Philippines'),
    ('SIN', 'Singapore Changi Airport', 'Singapore', 'Singapore'),
    ('NRT', 'Narita International Airport', 'Tokyo', 'Japan'),
    ('KIX', 'Kansai International Airport', 'Osaka', 'Japan'),
    ('FUK', 'Fukuoka Airport', 'Fukuoka', 'Japan'),
    ('ICN', 'Incheon International Airport', 'Seoul', 'South Korea'),
    ('HKG', 'Hong Kong International Airport', 'Hong Kong', 'Hong Kong'),
    ('BKK', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand')
ON CONFLICT DO NOTHING;

DELETE FROM flights_flight WHERE created_by_id = (
    SELECT id FROM accounts_user
    WHERE username = current_setting('predictbook.seed_staff_username')
);

WITH choices AS MATERIALIZED (
    SELECT day::date AS date, number,
        floor(random() * 5)::integer + 1 AS airline_index,
        floor(random() * 10)::integer AS origin_index,
        floor(random() * 9)::integer + 1 AS destination_offset,
        floor(random() * 216)::integer AS departure_step,
        floor(random() * 49)::integer AS duration_step,
        (ARRAY[180,220,250,300])[floor(random() * 4)::integer + 1] AS seats,
        random() * 0.20 - 0.10 AS noise
    FROM generate_series(timestamp '2026-01-01', timestamp '2026-12-31', interval '1 day') day
    CROSS JOIN generate_series(1,20) number
    ORDER BY day, number
), schedules AS MATERIALIZED (
    SELECT *,
        (ARRAY['5J','SQ','PR','Z2','NH'])[airline_index] AS airline_code,
        (ARRAY['MNL','CEB','DVO','SIN','NRT','KIX','FUK','ICN','HKG','BKK'])[origin_index + 1] AS origin_code,
        (ARRAY['MNL','CEB','DVO','SIN','NRT','KIX','FUK','ICN','HKG','BKK'])[(origin_index + destination_offset) % 10 + 1] AS destination_code,
        (date + time '05:00' + departure_step * interval '5 minutes') AT TIME ZONE current_setting('TimeZone') AS departure,
        least(0.97, greatest(0.15, 0.45
            + CASE extract(isodow FROM date) WHEN 5 THEN 0.22 WHEN 6 THEN 0.25 WHEN 7 THEN 0.20 ELSE 0 END
            + 0.12 * sin(extract(doy FROM date) / 20.0) + noise)) AS booked_share,
        row_number() OVER (ORDER BY date, number) AS running_number
    FROM choices
)
INSERT INTO flights_flight (created_by_id, airline_id, flight_number, origin_id,
    destination_id, departure_time, arrival_time, total_seats, available_seats)
SELECT staff.id, airline.id, airline_code || (100 + running_number), origin.id,
    destination.id, departure, departure + (60 + duration_step * 5) * interval '1 minute',
    seats, seats - floor(seats * booked_share)::integer
FROM schedules
JOIN flights_airline airline ON airline.code = airline_code
JOIN flights_airport origin ON origin.code = origin_code
JOIN flights_airport destination ON destination.code = destination_code
JOIN accounts_user staff ON staff.username = current_setting('predictbook.seed_staff_username');

DELETE FROM traffic_historicalrecord;

WITH choices AS MATERIALIZED (
    SELECT airport.id AS airport_id, day::date AS date,
        floor(random() * 45)::integer + 10 AS flights,
        (ARRAY[180,200,220])[floor(random() * 3)::integer + 1] AS seats_per_flight,
        random() * 0.20 - 0.10 AS noise
    FROM flights_airport airport
    CROSS JOIN generate_series(timestamp '2025-01-01', timestamp '2025-12-31', interval '1 day') day
    WHERE airport.code IN ('MNL','CEB','DVO','SIN','NRT','KIX','FUK','ICN','HKG','BKK')
    ORDER BY airport.code, day
)
INSERT INTO traffic_historicalrecord (airport_id, date, total_flights, seats_total, seats_booked)
SELECT airport_id, date, flights, flights * seats_per_flight,
    floor(flights * seats_per_flight * least(0.98, greatest(0.30, 0.50
        + CASE extract(isodow FROM date) WHEN 5 THEN 0.15 WHEN 6 THEN 0.18 WHEN 7 THEN 0.15 ELSE 0 END
        + 0.12 * sin(extract(doy FROM date) / 20.0) + noise)))::integer
FROM choices;
COMMIT;
