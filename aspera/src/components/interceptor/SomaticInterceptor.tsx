import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TYPOGRAPHY } from '../../constants/theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onSubmitFeeling: (feeling: string) => void;
  reappraisal: string | null;
  reappraisalLoading: boolean;
}

type Phase = 'breathe' | 'name' | 'reframe';

const BREATHE_DURATION = 4000;

export default function SomaticInterceptor({
  visible,
  onDismiss,
  onSubmitFeeling,
  reappraisal,
  reappraisalLoading,
}: Props) {
  const [phase, setPhase] = useState<Phase>('breathe');
  const [feeling, setFeeling] = useState('');

  // Animated values
  const breatheScale = useRef(new Animated.Value(1)).current;
  const pauseFade = useRef(new Animated.Value(0)).current;
  const breathTextFade = useRef(new Animated.Value(0)).current;
  const phaseFade = useRef(new Animated.Value(0)).current;

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPhase('breathe');
      setFeeling('');
      phaseFade.setValue(0);
      pauseFade.setValue(0);
      breathTextFade.setValue(0);
      breatheScale.setValue(1);
      startBreathePhase();
    } else {
      // Stop all animations when hidden
      breatheScale.stopAnimation();
      pauseFade.stopAnimation();
      breathTextFade.stopAnimation();
      phaseFade.stopAnimation();
    }
  }, [visible]);

  // Transition to reframe phase when reappraisal arrives
  useEffect(() => {
    if (phase === 'name' && reappraisal) {
      transitionToPhase('reframe');
    }
  }, [reappraisal, phase]);

  const startBreathePhase = () => {
    // Fade in "Pause." first
    Animated.timing(pauseFade, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Then fade in breathing text and start the circle animation
      Animated.timing(breathTextFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      // Breathing circle pulse loop
      const breatheAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(breatheScale, {
            toValue: 1.3,
            duration: BREATHE_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(breatheScale, {
            toValue: 1,
            duration: BREATHE_DURATION / 2,
            useNativeDriver: true,
          }),
        ]),
      );
      breatheAnimation.start();

      // After 4 seconds, transition to name phase
      setTimeout(() => {
        breatheAnimation.stop();
        transitionToPhase('name');
      }, BREATHE_DURATION);
    });
  };

  const transitionToPhase = (next: Phase) => {
    Animated.timing(phaseFade, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setPhase(next);
      Animated.timing(phaseFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSubmitFeeling = () => {
    const trimmed = feeling.trim();
    if (!trimmed) return;
    onSubmitFeeling(trimmed);
  };

  const renderBreathePhase = () => (
    <View style={styles.phaseContainer}>
      <Animated.Text style={[styles.pauseText, { opacity: pauseFade }]}>
        Pause.
      </Animated.Text>

      <Animated.View
        style={[
          styles.breatheCircle,
          { transform: [{ scale: breatheScale }] },
        ]}
      />

      <Animated.Text style={[styles.breatheText, { opacity: breathTextFade }]}>
        Take a breath.
      </Animated.Text>
    </View>
  );

  const renderNamePhase = () => (
    <Animated.View style={[styles.phaseContainer, { opacity: phaseFade }]}>
      <Text style={styles.promptText}>What are you feeling right now?</Text>

      <TextInput
        style={styles.input}
        value={feeling}
        onChangeText={setFeeling}
        placeholder="Name it..."
        placeholderTextColor="rgba(255,255,255,0.3)"
        autoFocus
        multiline
        returnKeyType="done"
        blurOnSubmit
        onSubmitEditing={handleSubmitFeeling}
      />

      <TouchableOpacity
        style={[styles.submitButton, !feeling.trim() && styles.submitButtonDisabled]}
        onPress={handleSubmitFeeling}
        disabled={!feeling.trim()}
        activeOpacity={0.7}
      >
        <Text style={[styles.submitText, !feeling.trim() && styles.submitTextDisabled]}>
          Submit
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderReframePhase = () => (
    <Animated.View style={[styles.phaseContainer, { opacity: phaseFade }]}>
      {reappraisalLoading ? (
        <ActivityIndicator color="rgba(255,255,255,0.6)" size="small" />
      ) : (
        <>
          <Text style={styles.reappraisalText}>{reappraisal}</Text>

          <TouchableOpacity
            style={styles.returnButton}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.returnText}>Return to focus</Text>
          </TouchableOpacity>
        </>
      )}
    </Animated.View>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {phase === 'breathe' && renderBreathePhase()}
        {phase === 'name' && renderNamePhase()}
        {phase === 'reframe' && renderReframePhase()}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  phaseContainer: {
    alignItems: 'center',
    width: '100%',
  },

  // -- Breathe phase --
  pauseText: {
    ...TYPOGRAPHY.hero,
    color: '#fff',
    marginBottom: 48,
  },

  breatheCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 48,
  },

  breatheText: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.6)',
  },

  // -- Name phase --
  promptText: {
    ...TYPOGRAPHY.title,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
  },

  input: {
    ...TYPOGRAPHY.body,
    color: '#fff',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    marginBottom: 32,
    textAlign: 'center',
    minHeight: 48,
  },

  submitButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  submitButtonDisabled: {
    borderColor: 'rgba(255,255,255,0.1)',
  },

  submitText: {
    ...TYPOGRAPHY.subtitle,
    color: '#fff',
  },

  submitTextDisabled: {
    color: 'rgba(255,255,255,0.2)',
  },

  // -- Reframe phase --
  reappraisalText: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
    paddingHorizontal: 8,
  },

  returnButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  returnText: {
    ...TYPOGRAPHY.subtitle,
    color: '#fff',
  },
});
