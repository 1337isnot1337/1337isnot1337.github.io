use path::{generate_path, get_schedule};
use yew::prelude::*;
mod path;

pub enum Msg {
    Increment,
    Decrement,
}

#[derive(Debug)]
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
    let path_value: UseStateHandle<Option<[[String; 8]; 5]>> =
        use_state(|| None::<[[String; 8]; 5]>);
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
            log::info!("User input: {}", *input_value);

            match get_schedule(&input_value) {
                Ok(schedule) => {
                    let path: [[String; 8]; 5] = generate_path(&schedule);

                    log::info!("Parsed schedule: {:?}", schedule);
                    log::info!("Generated path: {:?}", path);

                    path_value.set(Some(path));
                }
                Err(err) => error.set(Some(err.to_string())), // Use the cloned handle here
            };
        })
    };

    // HTML part starts here
    html! {
        <form onsubmit={on_submit}>
            <textarea placeholder="Enter schedule..." rows="20" cols="120" oninput={on_input} />
            <p></p>
            <button type="submit">{"Submit"}</button>

            if let Some(path) = &*path_value {
                <div>
                    <p>{"Path:"}</p>
                    { for path.iter().enumerate().map(|(i, row)| html! {
                        <div>
                            <p>{format!("Day {}:", i + 1)}</p>
                            <ul>
                                { for row.iter().enumerate().map(|(j, item)| html! {
                                    <li>{format!("Module {}: {}", j + 1, item)}</li>
                                }) }
                            </ul>
                        </div>
                    })}
                </div>
            }
            {match &*error {
                Some(error_val) => html! {<div> {format!("Error: {error_val}")}</div>},
                None => html! {<div> {format!("No error")}</div>},
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
