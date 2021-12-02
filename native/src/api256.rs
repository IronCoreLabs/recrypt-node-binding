use crate::util;
use neon::{prelude::*, types::JsBuffer};
use recrypt::api::{
    CryptoOps, DefaultRng, Ed25519, Ed25519Ops, Hashable, KeyGenOps, PublicSigningKey, RandomBytes,
    Recrypt, SchnorrOps, Sha256, SigningKeypair,
};

pub struct RecryptApi256 {
    api: Recrypt<Sha256, Ed25519, RandomBytes<DefaultRng>>,
}

declare_types! {
    pub class Api256 for RecryptApi256 {
        init(_cx) {
            Ok(RecryptApi256 {api: Recrypt::new()})
        }

        method generateKeyPair(mut cx) {
            let (priv_key, pub_key) = {
                let mut this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = this.borrow_mut(&guard);
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
            let signing_key_pair = {
                let mut this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.generate_ed25519_key_pair()
            };

            let signing_key_pair_obj: Handle<JsObject> = cx.empty_object();
            let priv_key_buffer = util::bytes_to_buffer(&mut cx, signing_key_pair.bytes())?;
            let pub_key_buffer = util::bytes_to_buffer(&mut cx, signing_key_pair.public_key().bytes())?;

            signing_key_pair_obj.set(&mut cx, "privateKey", priv_key_buffer)?;
            signing_key_pair_obj.set(&mut cx, "publicKey", pub_key_buffer)?;

            Ok(signing_key_pair_obj.upcast())
        }

        method ed25519Sign(mut cx) {
            let private_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
            let message_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(1)?;

            let signing_key_pair = SigningKeypair::from_bytes(&util::buffer_to_fixed_64_bytes(&mut cx, private_signing_key_buffer, "privateSigningKey")).unwrap();

            let signature = signing_key_pair.sign(&util::buffer_to_variable_bytes(&cx, message_buffer));

            Ok(util::bytes_to_buffer(&mut cx, signature.bytes())?.upcast())
        }

        method ed25519Verify(mut cx){
            let public_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
            let message_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(1)?;
            let signature_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;

            let public_signing_key = PublicSigningKey::new(util::buffer_to_fixed_32_bytes(&mut cx, public_signing_key_buffer, "publicSigningKey"));

            let verified = public_signing_key.verify(
                &util::buffer_to_variable_bytes(&cx, message_buffer),
                &util::buffer_to_ed25519_signature(&cx, signature_buffer)
            );

            Ok(cx.boolean(verified).upcast())
        }

        method computeEd25519PublicKey(mut cx){
            let private_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;

            let signing_key_pair = SigningKeypair::from_bytes(&util::buffer_to_fixed_64_bytes(&mut cx, private_signing_key_buffer, "privateSigningKey")).unwrap();

            let public_signing_key = signing_key_pair.public_key();
            Ok(util::bytes_to_buffer(&mut cx, public_signing_key.bytes())?.upcast())
        }

        method generatePlaintext(mut cx) {
            let plaintext = {
                let mut this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.gen_plaintext()
            };

            let plaintext_buffer = util::bytes_to_buffer(&mut cx, plaintext.bytes())?;
            Ok(plaintext_buffer.upcast())
        }

        method generateTransformKey(mut cx) {
            let from_private_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
            let to_public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let private_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;

            let to_public_key = util::js_object_to_public_key(&mut cx, to_public_key_obj);
            let signing_key_pair = SigningKeypair::from_bytes(&util::buffer_to_fixed_64_bytes(&mut cx, private_signing_key_buffer, "privateSigningKey")).unwrap();

            let transform_key = {
                let mut this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.generate_transform_key(
                    &util::buffer_to_private_key(&cx, from_private_key_buffer),
                    &to_public_key,
                    &signing_key_pair
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
                let recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.derive_symmetric_key(&util::buffer_to_plaintext(&cx, plaintext_buffer))
            };

            Ok(util::bytes_to_buffer(&mut cx, decrypted_symmetric_key.bytes())?.upcast())
        }

        method encrypt(mut cx) {
            let plaintext_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
            let to_public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let private_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;

            let public_key = util::js_object_to_public_key(&mut cx, to_public_key_obj);
            let signing_key_pair = SigningKeypair::from_bytes(&util::buffer_to_fixed_64_bytes(&mut cx, private_signing_key_buffer, "privateSigningKey")).unwrap();

            let encrypted_value = {
                let mut this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.encrypt(
                    &util::buffer_to_plaintext(&cx, plaintext_buffer),
                    &public_key,
                    &signing_key_pair
                ).unwrap()
            };

            Ok(util::encrypted_value_to_js_object(&mut cx, encrypted_value)?.upcast())
        }

        method transform(mut cx) {
            let encrypted_value_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
            let transform_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let private_signing_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;

            let encrypted_value = util::js_object_to_encrypted_value(&mut cx, encrypted_value_obj);
            let transform_key = util::js_object_to_transform_key(&mut cx, transform_key_obj);
            let signing_key_pair = SigningKeypair::from_bytes(&util::buffer_to_fixed_64_bytes(&mut cx, private_signing_key_buffer, "privateSigningKey")).unwrap();

            let transformed_encrypted_value = {
                let mut this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.transform(encrypted_value, transform_key, &signing_key_pair).unwrap()
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

        method schnorrSign(mut cx){
            let private_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
            let public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;
            let message_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;

            let public_key = util::js_object_to_public_key(&mut cx, public_key_obj);

            let signature = {
                let mut this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.schnorr_sign(
                    &util::buffer_to_private_key(&cx, private_key_buffer),
                    &public_key,
                    &util::buffer_to_variable_bytes(&cx, message_buffer)
                )
            };

            Ok(util::bytes_to_buffer(&mut cx, signature.bytes())?.upcast())
        }

        method schnorrVerify(mut cx) {
            let public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
            //The augmented private key is an optional argument to take in a generic JsValue
            let augmented_private_key_buffer: Handle<JsValue> = cx.argument::<JsValue>(1)?;
            let message_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(2)?;
            let signature_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(3)?;

            let public_key = util::js_object_to_public_key(&mut cx, public_key_obj);
            let signature = util::buffer_to_schnorr_signature(&mut cx, signature_buffer);

            let augmented_private_key = {
                //Ignore both null or undefined as values are passed for augmented private key
                if augmented_private_key_buffer.is_a::<JsUndefined>() {
                    None
                }
                else if augmented_private_key_buffer.is_a::<JsNull>() {
                    None
                }
                else {
                    Some(util::buffer_to_private_key(&cx, augmented_private_key_buffer.downcast::<JsBuffer>().unwrap()))
                }
            };

            let verified = {
                let mut this = cx.this();
                let guard = cx.lock();
                let recrypt_api_256 = this.borrow_mut(&guard);
                recrypt_api_256.api.schnorr_verify(
                    &public_key,
                    augmented_private_key.as_ref(),
                    &util::buffer_to_variable_bytes(&cx, message_buffer),
                    signature
                )
            };
            Ok(cx.boolean(verified).upcast())
        }
    }
}

/// Augment the provided transform key with the provided private key. Returns an augmented TransformKey object.
pub fn augment_transform_key_256(mut cx: FunctionContext) -> JsResult<JsObject> {
    let transform_key_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
    let private_key_buffer: Handle<JsBuffer> = cx.argument::<JsBuffer>(1)?;
    let transform_key = util::js_object_to_transform_key(&mut cx, transform_key_obj);

    let augmented_transform_key = transform_key
        .augment(&util::buffer_to_private_key(&cx, private_key_buffer))
        .unwrap();

    Ok(util::transform_key_to_js_object(&mut cx, augmented_transform_key)?.upcast())
}

/// Augment the provided public key with the other provided public key. Returns a new augmented PublicKey object.
pub fn augment_public_key_256(mut cx: FunctionContext) -> JsResult<JsObject> {
    let current_public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
    let other_public_key_obj: Handle<JsObject> = cx.argument::<JsObject>(1)?;

    let current_public_key = util::js_object_to_public_key(&mut cx, current_public_key_obj);

    let augmented_public_key = current_public_key
        .augment(&util::js_object_to_public_key(
            &mut cx,
            other_public_key_obj,
        ))
        .unwrap();

    Ok(util::public_key_to_js_object(&mut cx, &augmented_public_key)?.upcast())
}

/// Hash the provided transform key into a buffer of bytes. The various transform key object fields are concatenated
/// in a specific order in order for transform keys to be signed over.
pub fn transform_key_to_bytes_256(mut cx: FunctionContext) -> JsResult<JsBuffer> {
    let transform_key_obj: Handle<JsObject> = cx.argument::<JsObject>(0)?;
    let transform_key = util::js_object_to_transform_key(&mut cx, transform_key_obj);

    let transform_key_bytes = util::bytes_to_buffer(&mut cx, &transform_key.to_bytes())?;

    Ok(transform_key_bytes)
}

/// Add the two provided private keys together. Used when performing key rotation.
pub fn add_private_keys(mut cx: FunctionContext) -> JsResult<JsBuffer> {
    let pub_key_a: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
    let pub_key_b: Handle<JsBuffer> = cx.argument::<JsBuffer>(1)?;
    let augmented = util::buffer_to_private_key(&cx, pub_key_a)
        .augment_plus(&util::buffer_to_private_key(&cx, pub_key_b));

    Ok(util::bytes_to_buffer(&mut cx, &augmented.to_bytes())?)
}

/// Subtract the second provided private key from the first provided private key. Used when performing key rotation
pub fn subtract_private_keys(mut cx: FunctionContext) -> JsResult<JsBuffer> {
    let pub_key_a: Handle<JsBuffer> = cx.argument::<JsBuffer>(0)?;
    let pub_key_b: Handle<JsBuffer> = cx.argument::<JsBuffer>(1)?;
    let augmented = util::buffer_to_private_key(&cx, pub_key_a)
        .augment_minus(&util::buffer_to_private_key(&cx, pub_key_b));

    Ok(util::bytes_to_buffer(&mut cx, &augmented.to_bytes())?)
}
