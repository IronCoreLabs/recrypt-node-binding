#[macro_use]
extern crate neon;
extern crate rand;
extern crate recrypt;

mod api256;
mod util;

register_module!(mut cx, {
    cx.export_function("augmentTransformKey256", api256::augment_transform_key_256)?;
    cx.export_function("augmentPublicKey256", api256::augment_public_key_256)?;
    cx.export_function("transformKeyToBytes", api256::transform_key_to_bytes)?;
    cx.export_class::<api256::Api256>("Api256")
});
