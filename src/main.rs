use path::{generate_path, get_schedule};
use yew::prelude::*;
mod path;

pub enum Msg {
    Increment,
    Decrement,
}

#[derive(Debug, PartialEq)]
pub enum Semester {
    S1,
    S2,
}

#[derive(Debug, PartialEq, Eq, Hash)]
pub enum Day {
    A,
    B,
    C,
    D,
    I,
}

#[derive(Debug)]
pub struct Class {
    pub days: Vec<Day>,
    pub mods: Vec<u8>,
    pub semester: Semester,
    pub short_name: String,
    pub long_name: String,
    pub teacher: String,
    pub room: String,
    pub start: String,
    pub end: String,
}

#[function_component(App)]
fn app() -> Html {
    let input_value: UseStateHandle<String> = use_state(String::new);
    let path_value: UseStateHandle<Option<Vec<(String, [[String; 8]; 5])>>> = use_state(|| None);
    let error: UseStateHandle<Option<String>> = use_state(|| None);

    let on_input: Callback<InputEvent> = {
        let input_value: UseStateHandle<String> = input_value.clone();
        Callback::from(move |e: InputEvent| {
            let input: String = e
                .target_unchecked_into::<web_sys::HtmlInputElement>()
                .value();
            input_value.set(input);
        })
    };

    let on_submit: Callback<SubmitEvent> = {
        let input_value = input_value.clone();
        let path_value = path_value.clone();
        let error = error.clone(); // Clone the `error` handle

        Callback::from(move |e: SubmitEvent| {
            e.prevent_default(); // Prevent the default form submission behavior
            match get_schedule(&input_value) {
                Ok(schedule) => {
                    let paths = [Semester::S1, Semester::S2]
                        .into_iter()
                        .filter(|term| schedule.iter().any(|class| &class.semester == term))
                        .map(|term| (format!("{:?}", term), generate_path(&schedule, &term)))
                        .collect();

                    error.set(None);
                    path_value.set(Some(paths));
                }
                Err(err) => {
                    path_value.set(None);
                    error.set(Some(err.to_string()));
                }
            };
        })
    };

    // HTML part starts here
    html! {
        <form onsubmit={on_submit}>
            <textarea aria-label="PowerSchool schedule" placeholder="Enter schedule..." rows="20" cols="120" oninput={on_input} />
            <p></p>
            <button type="submit">{"Submit"}</button>

            if let Some(paths) = &*path_value {
                <div class="schedule-results" aria-live="polite">
                    { for paths.iter().map(|(term, path)| html! {
                        <section>
                            <h2>{format!("{term} room list")}</h2>
                            <div class="schedule-days">
                            { for path.iter().enumerate().map(|(i, row)| html! {
                                <section>
                                    <h3>{format!("{} day", ["A", "B", "I", "C", "D"][i])}</h3>
                                    <ol>
                                        { for row.iter().map(|item| html! {
                                            <li>{if item.is_empty() { "Free period" } else { item }}</li>
                                        }) }
                                    </ol>
                                </section>
                            }) }
                            </div>
                        </section>
                    }) }
                </div>
            }
            {match &*error {
                Some(error_val) => html! {<div role="alert"> {format!("Error: {error_val}")}</div>},
                None => Html::default(),
            }}
        </form>
    }
}

fn main() {
    wasm_logger::init(wasm_logger::Config::default());
    yew::Renderer::<App>::new().render();
}

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
