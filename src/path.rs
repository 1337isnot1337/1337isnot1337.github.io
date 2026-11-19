use crate::{Class, Day, Semester};

//as an example, below is a schedule that could be entered in by the user,
/*
Y24-25 Semester 1
Exp    Trm    Crs-Sec    Course Name    Teacher    Room    Enroll    Leave
2(A,C-D)    S1    ENG201b-1    Literary Explorations III: British    Townsend, Tracy A    A113    08/19/2024    01/19/2025
4(A-D)    S1    FAR110-1    Wind Ensemble    McCarthy, Mary Beth C    D107    08/19/2024    01/19/2025
5(A-B,D)    S1    HSS201b-3    Conflict in World History    Eysturlid, Lee    A147    08/19/2024    01/19/2025
6(A-D)    S1    WLG250-101    Spanish V    Kaluza, Marta J    A131    08/19/2024    01/19/2025
7(A-D)    S1    MAT473-2    Linear Algebra    Brummet, Evan    A135    08/19/2024    01/19/2025
8(A-D)    S1    MAT474-1    Abstract Algebra    Fogel, Micah    A155    08/19/2024    01/19/2025
*/

pub struct ScheduleInfo {
    pub mods: Vec<String>,
    pub semester: Vec<String>,
    pub short_name: Vec<String>,
    pub long_name: Vec<String>,
    pub teacher: Vec<String>,
    pub room: Vec<String>,
    pub start: Vec<String>,
    pub end: Vec<String>,
}
pub fn get_schedule(input: &str) -> Result<Vec<Class>, &str> {
    let lines: Vec<&str> = input
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect();
    // Accept copied class rows with zero, one, or two heading lines. Detect
    // class-like rows before skipping headings so valid classes never vanish.
    // Include malformed periods here: the normal parser must report them.
    let looks_like_class = |line: &str| {
        let normalized = line.replace("    ", "\t");
        let mut cells = normalized.split('\t').map(str::trim);
        let period = cells.next().unwrap_or("");
        period.contains('(')
            || (normalized.contains('\t') && period.starts_with(|c: char| c.is_ascii_digit()))
            || matches!(cells.next(), Some("S1" | "S2"))
    };
    let heading_count = lines
        .iter()
        .take(2)
        .position(|line| looks_like_class(line))
        .unwrap_or(2);
    if lines.len() <= heading_count {
        return Err("Paste at least one class row, with or without the schedule headings");
    }
    let listvec = &lines[heading_count..];

    let mut mods = Vec::new();
    let mut semester = Vec::new();
    let mut short_name = Vec::new();
    let mut long_name = Vec::new();
    let mut teacher = Vec::new();
    let mut room = Vec::new();
    let mut start = Vec::new();
    let mut end = Vec::new();

    for line in listvec {
        let line = line.replace("    ", "\t");
        let split: Vec<String> = line.split('\t').map(|s| s.trim().to_string()).collect();
        if split.len() < 8 {
            return Err("Expected eight tab-separated columns in each class row");
        }
        if !matches!(split[1].as_str(), "S1" | "S2") {
            return Err("Expected S1 or S2 in the term column");
        }
        let Some((periods, days)) = split[0].split_once('(') else {
            return Err("Expected a class period followed by its days, such as 2(A,C-D)");
        };
        parse_mods(periods)?;
        if !days.ends_with(')') {
            return Err("Close the class days with a parenthesis, such as 2(A,C-D)");
        }
        let valid_day = |d: &str| matches!(d, "A" | "B" | "C" | "D" | "I");
        for day in days.trim_end_matches(')').split(',').map(str::trim) {
            if valid_day(day) {
                continue;
            }
            match day.split_once('-') {
                Some((a, b)) if valid_day(a) && valid_day(b) && a <= b && b != "I" => {}
                _ => return Err("Expected a day or day range such as A,C-D"),
            }
        }
        mods.push(split[0].clone());
        semester.push(split[1].clone());
        short_name.push(split[2].clone());
        long_name.push(split[3].clone());
        teacher.push(split[4].clone());
        room.push(split[5].clone());
        start.push(split[6].clone());
        end.push(split[7].clone());
    }

    if mods.is_empty() {
        return Err("Add at least one class row");
    }
    let classes = sort_by_day(&ScheduleInfo {
        mods,
        semester,
        short_name,
        long_name,
        teacher,
        room,
        start,
        end,
    });
    // A weekly room list cannot choose between different locations assigned
    // to the same slot. Repeated copies of the same location are harmless.
    for (index, class) in classes.iter().enumerate() {
        for earlier in &classes[..index] {
            if class.semester == earlier.semester
                && class.room != earlier.room
                && class.days.iter().any(|day| earlier.days.contains(day))
                && class
                    .mods
                    .iter()
                    .any(|period| earlier.mods.contains(period))
            {
                return Err("Conflicting rooms for the same semester, day, and period. Check the pasted class rows.");
            }
        }
    }
    Ok(classes)
}

fn parse_day(day_str: &str) -> Vec<Day> {
    let mut days = vec![];
    for day in day_str.split(',').map(str::trim) {
        match day {
            "A" => days.push(Day::A),
            "B" => days.push(Day::B),
            "C" => days.push(Day::C),
            "D" => days.push(Day::D),
            "I" => days.push(Day::I),
            _ => {
                let (start, end) = day.split_at(1);
                if let Some(start) = start.chars().next() {
                    let end = end.trim_start_matches('-').chars().next();
                    for d in start..=end.unwrap_or(start) {
                        days.push(parse_day_char(d));
                    }
                } else {
                    panic!("Unknown day pattern: {day}")
                }
            }
        }
    }
    days
}

fn parse_day_char(ch: char) -> Day {
    match ch {
        'A' => Day::A,
        'B' => Day::B,
        'C' => Day::C,
        'D' => Day::D,
        'I' => Day::I,
        _ => panic!("Unknown day char: {ch}"),
    }
}

fn parse_mods(mod_str: &str) -> Result<Vec<u8>, &'static str> {
    let parse = |value: &str| -> Result<u8, &'static str> {
        match value.as_bytes() {
            [digit @ b'1'..=b'8'] => Ok(digit - b'0'),
            _ => Err("Class periods must be between 1 and 8"),
        }
    };
    match mod_str.split_once('-') {
        Some((start, end)) => {
            let (start, end) = (parse(start)?, parse(end)?);
            if start > end {
                return Err("A period range must run forwards, such as 2-4");
            }
            Ok((start..=end).collect())
        }
        None => Ok(vec![parse(mod_str)?]),
    }
}

fn sort_by_day(schedule_info: &ScheduleInfo) -> Vec<Class> {
    schedule_info
        .mods
        .iter()
        .enumerate()
        .map(|(item, mods_days)| {
            let (mod_str, day_str) = mods_days.split_once('(').unwrap();
            let days = parse_day(day_str.trim_end_matches(')'));
            let mods = parse_mods(mod_str).expect("periods validated by get_schedule");

            Class {
                days,
                mods,
                semester: match schedule_info.semester[item].as_str() {
                    "S1" => Semester::S1,
                    "S2" => Semester::S2,
                    _ => panic!("Unknown semester: {}", schedule_info.semester[item]),
                },
                short_name: schedule_info.short_name[item].clone(),
                long_name: schedule_info.long_name[item].clone(),
                teacher: schedule_info.teacher[item].clone(),
                room: schedule_info.room[item].clone(),
                start: schedule_info.start[item].clone(),
                end: schedule_info.end[item].clone(),
            }
        })
        .collect()
}

pub fn generate_path(weekly_schedule: &[Class], semester: &Semester) -> [[String; 8]; 5] {
    let mut weekly_path: [[String; 8]; 5] = [
        Default::default(),
        Default::default(),
        Default::default(),
        Default::default(),
        Default::default(),
    ];

    for day in 0..5 {
        let letter_day: Day = match day {
            0 => Day::A,
            1 => Day::B,
            2 => Day::I,
            3 => Day::C,
            4 => Day::D,
            _ => unreachable!("i hope this is unreachable"),
        };

        for class in weekly_schedule {
            if &class.semester == semester && class.days.contains(&letter_day) {
                // An occupied period without a room is not a free period.
                let room = if class.room.trim().is_empty() {
                    "Room not listed".to_string()
                } else {
                    class.room.clone()
                };
                for mods in &class.mods {
                    match mods {
                        1 => weekly_path[day][0].clone_from(&room),
                        2 => weekly_path[day][1].clone_from(&room),
                        3 => weekly_path[day][2].clone_from(&room),
                        4 => weekly_path[day][3].clone_from(&room),
                        5 => weekly_path[day][4].clone_from(&room),
                        6 => weekly_path[day][5].clone_from(&room),
                        7 => weekly_path[day][6].clone_from(&room),
                        8 => weekly_path[day][7].clone_from(&room),
                        _ => panic!("Unexpected val --> {mods}"),
                    }
                }
            }
        }
    }

    weekly_path
}

#[cfg(test)]
mod tests {
    use super::*;
    fn row(period: &str, term: &str, room: &str) -> String {
        format!("{period}\t{term}\tMAT101\tMath\tExample\t{room}\tstart\tend")
    }
    #[test]
    fn inclusive_period_ranges() {
        assert_eq!(parse_mods("2-4"), Ok(vec![2, 3, 4]));
        assert_eq!(parse_mods("8"), Ok(vec![8]));
        for invalid in ["4-2", "1-2-3", "0", "9", "", "12"] {
            assert!(parse_mods(invalid).is_err(), "{invalid}");
        }
    }
    #[test]
    fn semesters_do_not_overwrite_each_other() {
        let input = format!(
            "Schedule\nHeadings\n{}\n{}\n",
            row("2-4(A,C-D)", "S1", "A113"),
            row("3(A)", "S2", "B204")
        );
        let classes = get_schedule(&input).unwrap();
        let first = generate_path(&classes, &Semester::S1);
        let second = generate_path(&classes, &Semester::S2);
        assert_eq!(&first[0][1..4], &["A113", "A113", "A113"]);
        assert_eq!(first[2][2], "");
        assert_eq!(first[3][2], "A113");
        assert_eq!(second[0][2], "B204");
        assert_eq!(second[0][1], "");
    }
    #[test]
    fn optional_headings_never_discard_classes() {
        let rows = [
            row("1(A)", "S1", "A101"),
            row("2(A)", "S1", "A102"),
            row("3(A)", "S1", "A103"),
        ]
        .join("\n");
        for prefix in [
            "",
            "Headings\n",
            "Schedule\nHeadings\n",
            "2026-2027\nHeadings\n",
            "\nSchedule\n\nHeadings\n",
        ] {
            let classes = get_schedule(&format!("{prefix}{rows}\n")).unwrap();
            assert_eq!(classes.len(), 3);
            let path = generate_path(&classes, &Semester::S1);
            assert_eq!(&path[0][..3], &["A101", "A102", "A103"]);
        }
        assert_eq!(get_schedule(&row("1(A)", "S1", "A101")).unwrap().len(), 1);
        assert!(get_schedule(&format!("{}\n{rows}", row("9(A)", "S1", "X"))).is_err());
    }

    #[test]
    fn missing_rooms_are_not_free_periods() {
        for room in ["", "   "] {
            let classes = get_schedule(&row("1(A)", "S1", room)).unwrap();
            let path = generate_path(&classes, &Semester::S1);
            assert_eq!(path[0][0], "Room not listed");
            assert_eq!(path[0][1], "");
        }
    }

    #[test]
    fn conflicting_rooms_are_rejected_in_either_order() {
        for (a, b) in [("A101", "B204"), ("", "B204"), ("   ", "B204")] {
            for (first, second) in [(a, b), (b, a)] {
                let input = format!(
                    "{}\n{}",
                    row("1-3(A,C-D)", "S1", first),
                    row("2(C)", "S1", second)
                );
                assert!(
                    matches!(get_schedule(&input), Err(message) if message.contains("Conflicting rooms"))
                );
            }
        }
    }

    #[test]
    fn duplicate_rooms_and_separate_slots_are_allowed() {
        for (first, second) in [
            (row("1(A)", "S1", "A101"), row("1(A)", "S1", " A101 ")),
            (row("1(A)", "S1", ""), row("1(A)", "S1", "   ")),
            (row("1(A)", "S1", "A101"), row("1(A)", "S2", "B204")),
            (row("1(A)", "S1", "A101"), row("1(B)", "S1", "B204")),
            (row("1(A)", "S1", "A101"), row("2(A)", "S1", "B204")),
        ] {
            assert!(get_schedule(&format!("{first}\n{second}")).is_ok());
        }
    }

    #[test]
    fn malformed_input_returns_errors() {
        for period in ["2(A", "2(Z)", "2(A-I)", "2-4-6(A)", "4-2(A)"] {
            assert!(get_schedule(&format!(
                "Schedule\nHeadings\n{}",
                row(period, "S1", "A113")
            ))
            .is_err());
        }
        assert!(get_schedule("empty").is_err());
    }
}
