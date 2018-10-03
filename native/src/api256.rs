use neon::prelude::*;
use neon::types::JsBuffer;
use rand;
use recrypt::api::{
    Api, CryptoOps, Ed25519, Ed25519Ops, KeyGenOps, PrivateSigningKey, PublicSigningKey,
    RandomBytes, Sha256,
};
use util;

pub struct RecryptApi256 {
    api: Api<Sha256, Ed25519, RandomBytes<rand::ThreadRng>>,
}

declare_types! {
    pub class Api256 for RecryptApi256 {
        init(_cx) {
            Ok(RecryptApi256 {api: Api::new()})
        }

        method generateKeyPair(mut cx) {
            let (priv_key, pub_key) = {
                let mut this = cx.this();
                let guard = cx.lock();
                let mut recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.generate_key_pair().unwrap()
            };

            let key_pair: Handle<JsObject> = cx.empty_object();

            let priv_key_buffer = util::bytes_to_buffer(&mut cx, priv_key.bytes())?;
            let public_key_obj = util::public_key_to_js_object(&mut cx, &pub_key)?;

            key_pair.set(&mut cx, "privateKey", priv_key_buffer)?;
            key_pair.set(&mut cx, "publicKey", public_key_obj)?;

            Ok(key_pair.upcast())
        }

        method generateEd25519KeyPair(mut cx) {
            let (priv_key, pub_key) = {
                let mut this = cx.this();
                let guard = cx.lock();
                let mut recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.generate_ed25519_key_pair()
            };

            let signing_key_pair: Handle<JsObject> = cx.empty_object();
            let priv_key_buffer = util::bytes_to_buffer(&mut cx, priv_key.bytes())?;
            let pub_key_buffer = util::bytes_to_buffer(&mut cx, pub_key.bytes())?;

            signing_key_pair.set(&mut cx, "privateKey", priv_key_buffer)?;
            signing_key_pair.set(&mut cx, "publicKey", pub_key_buffer)?;

            Ok(signing_key_pair.upcast())
        }

        method generatePlaintext(mut cx) {
            let plaintext = {
                let mut this = cx.this();
                let guard = cx.lock();
                let mut recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.gen_plaintext()
            };

            let plaintext_buffer = util::bytes_to_buffer(&mut cx, plaintext.bytes())?;
            Ok(plaintext_buffer.upcast())
        }

        method generateTransformKey(mut cx) {
            let from_private_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
            let to_public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let public_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;
            let private_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(3)?;

            let to_public_key = util::js_object_to_public_key(&mut cx, to_public_key_obj);
            let public_signing_key = PublicSigningKey::new(util::buffer_to_fixed_32_bytes(&mut cx, public_signing_key_buffer, "publicSigningKey"));
            let private_signing_key = PrivateSigningKey::new(util::buffer_to_fixed_64_bytes(&mut cx, private_signing_key_buffer, "privateSigningKey"));

            let transform_key = {
                let mut this = cx.this();
                let guard = cx.lock();
                let mut recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.generate_transform_key(
                    &util::buffer_to_private_key(&cx, from_private_key_buffer),
                    to_public_key,
                    public_signing_key,
                    &private_signing_key
                ).unwrap()
            };

            Ok(util::transform_key_to_js_object(&mut cx, transform_key)?.upcast())
        }

        method computePublicKey(mut cx){
            let private_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
            let derived_public_key = {
                let this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = &this.borrow(&guard).api;
                recrypt_api_256.compute_public_key(&util::buffer_to_private_key(&cx, private_key_buffer)).unwrap()
            };

            Ok(util::public_key_to_js_object(&mut cx, &derived_public_key)?.upcast())
        }

        method deriveSymmetricKey(mut cx){
            let plaintext_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;

            let decrypted_symmetric_key = {
                let mut this = cx.this();
                let guard = cx.lock();
                let mut recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.derive_symmetric_key(&util::buffer_to_plaintext(&cx, plaintext_buffer))
            };

            Ok(util::bytes_to_buffer(&mut cx, decrypted_symmetric_key.bytes())?.upcast())
        }

        method encrypt(mut cx) {
            let plaintext_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
            let to_public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let public_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;
            let private_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(3)?;

            let public_key = util::js_object_to_public_key(&mut cx, to_public_key_obj);
            let public_signing_key = PublicSigningKey::new(util::buffer_to_fixed_32_bytes(&mut cx, public_signing_key_buffer, "publicSigningKey"));
            let private_signing_key = PrivateSigningKey::new(util::buffer_to_fixed_64_bytes(&mut cx, private_signing_key_buffer, "privateSigningKey"));

            let encrypted_value = {
                let mut this = cx.this();
                let guard = cx.lock();
                let mut recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.encrypt(
                    &util::buffer_to_plaintext(&cx, plaintext_buffer),
                    public_key,
                    public_signing_key,
                    &private_signing_key
                ).unwrap()
            };

            Ok(util::encrypted_value_to_js_object(&mut cx, encrypted_value)?.upcast())
        }

        method transform(mut cx) {
            let encrypted_value_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
            let transform_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let public_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;
            let private_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(3)?;

            let encrypted_value = util::js_object_to_encrypted_value(&mut cx, encrypted_value_obj);
            let transform_key = util::js_object_to_transform_key(&mut cx, transform_key_obj);
            let public_signing_key = PublicSigningKey::new(util::buffer_to_fixed_32_bytes(&mut cx, public_signing_key_buffer, "publicSigningKey"));
            let private_signing_key = PrivateSigningKey::new(util::buffer_to_fixed_64_bytes(&mut cx, private_signing_key_buffer, "privateSigningKey"));

            let transformed_encrypted_value = {
                let mut this = cx.this();
                let guard = cx.lock();
                let mut recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.transform(encrypted_value, transform_key, public_signing_key, &private_signing_key).unwrap()
            };

            Ok(util::encrypted_value_to_js_object(&mut cx, transformed_encrypted_value)?.upcast())
        }

        method decrypt(mut cx) {
            let encrypted_value_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
            let private_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(1)?;

            let encrypted_value = util::js_object_to_encrypted_value(&mut cx, encrypted_value_obj);

            let decrypted_value = {
                let this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = &this.borrow(&guard).api;
                recrypt_api_256.decrypt(
                    encrypted_value,
                    &util::buffer_to_private_key(&cx, private_key_buffer)
                ).unwrap()
            };

            Ok(util::bytes_to_buffer(&mut cx, decrypted_value.bytes())?.upcast())
        }
    }
}

///
/// Augment the provided transform key with the provided private key. Returns an augmented TransformKey object.
///
pub fn augment_transform_key_256(mut cx: FunctionContext) -> JsResult<JsObject> {
    let transform_key_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
    let private_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(1)?;
    let transform_key = util::js_object_to_transform_key(&mut cx, transform_key_obj);

    let augmented_transform_key = transform_key
        .augment(&util::buffer_to_private_key(&cx, private_key_buffer))
        .unwrap();

    Ok(util::transform_key_to_js_object(&mut cx, augmented_transform_key)?.upcast())
}

///
/// Augment the provided public key with the other provided public key. Returns a new augmented PublicKey object.
///
pub fn augment_public_key_256(mut cx: FunctionContext) -> JsResult<JsObject> {
    let current_public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
    let other_public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;

    let current_public_key = util::js_object_to_public_key(&mut cx, current_public_key_obj);

    let augmented_public_key = current_public_key
        .augment(&util::js_object_to_public_key(
            &mut cx,
            other_public_key_obj,
        )).unwrap();

    Ok(util::public_key_to_js_object(&mut cx, &augmented_public_key)?.upcast())
}
